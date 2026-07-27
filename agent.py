"""Single-file Harbor agent harness: --agent-import-path agent:AutoAgent."""

from __future__ import annotations

import json
import os
import time
from datetime import datetime, timezone
from pathlib import Path

from openai import AsyncOpenAI

from agents import Agent, Runner, function_tool, set_default_openai_api, set_default_openai_client
from agents.run_config import RunConfig
from agents.items import (
    ItemHelpers,
    MessageOutputItem,
    ReasoningItem,
    ToolCallItem,
    ToolCallOutputItem,
)
from agents.tool import FunctionTool
from agents.usage import Usage
from harbor.agents.base import BaseAgent
from harbor.environments.base import BaseEnvironment
from harbor.models.agent.context import AgentContext


# ============================================================================
# EDITABLE HARNESS — prompt, tools, agent construction
# ============================================================================

SYSTEM_PROMPT = (
    "You are an agent that executes Harbor SkillEval tasks.\n"
    "Always read /task/files/input.json first with run_shell.\n"
    "For local_visibility_audit tasks: run "
    "`python3 /task/_shared/lvs_apply_rules.py` "
    "(writes /task/output.json using the deterministic GBP rule engine). "
    "Do not invent rule ids or re-derive thresholds by hand when that script exists.\n"
    "For other skills: apply only the rule ids listed in the instruction — "
    "do not invent data or ZIP codes.\n"
    "Write the final JSON to /task/output.json exactly in the required shape, then stop.\n"
    "Do not invent files like service_areas.txt. Use only files under /task/."
)
MAX_TURNS = 30

# Local-first: Ollama OpenAI-compatible API (no cloud key). Override via .env:
#   AUTOAGENT_LLM_PROVIDER=ollama|openai
#   OLLAMA_BASE_URL=http://127.0.0.1:11434/v1
#   OLLAMA_MODEL=qwen2.5:7b-instruct
LLM_PROVIDER = os.getenv("AUTOAGENT_LLM_PROVIDER", "ollama").strip().lower()


def _load_local_env() -> None:
    """Load repo .env without overriding variables already exported in the shell."""
    env_path = Path(__file__).resolve().parent / ".env"
    if not env_path.is_file():
        return
    for raw in env_path.read_text().splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


def _resolve_task_dir(logs_dir: Path) -> Path | None:
    """Harbor writes trial config.json beside agent/ — use it when env is unset."""
    explicit = os.getenv("AUTOAGENT_TASK_DIR", "").strip()
    if explicit:
        return Path(explicit).expanduser().resolve()

    config_path = logs_dir.parent / "config.json"
    if not config_path.is_file():
        return None

    data = json.loads(config_path.read_text())
    rel = (data.get("task") or {}).get("path")
    if not rel:
        return None

    repo_root = Path(__file__).resolve().parent
    return (repo_root / rel).resolve()


_load_local_env()
LLM_PROVIDER = os.getenv("AUTOAGENT_LLM_PROVIDER", "ollama").strip().lower()


def configure_llm() -> str:
    """Wire the OpenAI Agents SDK to Ollama (local) or OpenAI (cloud)."""
    if LLM_PROVIDER == "ollama":
        base_url = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434/v1").rstrip("/")
        model = os.getenv("OLLAMA_MODEL", "qwen2.5:7b")
        client = AsyncOpenAI(
            base_url=base_url,
            api_key=os.getenv("OPENAI_API_KEY", "ollama"),
        )
        set_default_openai_client(client, use_for_tracing=False)
        set_default_openai_api("chat_completions")
        os.environ.setdefault("OPENAI_AGENTS_TRACE_INCLUDE_SENSITIVE_DATA", "false")
        return model

    if LLM_PROVIDER == "openai":
        if not os.getenv("OPENAI_API_KEY"):
            raise RuntimeError(
                "OPENAI_API_KEY is required when AUTOAGENT_LLM_PROVIDER=openai"
            )
        mode = os.getenv("OPENAI_API_MODE", "responses").strip().lower()
        set_default_openai_api("chat_completions" if mode == "chat_completions" else "responses")
        return os.getenv("OPENAI_MODEL", "gpt-5")

    raise RuntimeError(
        f"Unknown AUTOAGENT_LLM_PROVIDER={LLM_PROVIDER!r}. Use 'ollama' or 'openai'."
    )


MODEL = os.getenv("AUTOAGENT_MODEL") or configure_llm()


def create_tools(environment: BaseEnvironment) -> list[FunctionTool]:
    """Create tools for the agent. Add new tools here."""

    @function_tool
    async def run_shell(command: str) -> str:
        """Run a shell command in the task environment. Returns stdout and stderr."""
        try:
            result = await environment.exec(command=command, timeout_sec=120)
            out = ""
            if result.stdout:
                out += result.stdout
            if result.stderr:
                out += f"\nSTDERR:\n{result.stderr}" if out else f"STDERR:\n{result.stderr}"
            return out or "(no output)"
        except Exception as exc:
            return f"ERROR: {exc}"

    return [run_shell]


def create_agent(environment: BaseEnvironment) -> Agent:
    """Build the agent. Modify to add handoffs, sub-agents, or agent-as-tool."""
    tools = create_tools(environment)
    return Agent(
        name="autoagent",
        instructions=SYSTEM_PROMPT,
        tools=tools,
        model=MODEL,
    )


async def run_task(
    environment: BaseEnvironment,
    instruction: str,
) -> tuple[object, int]:
    """Run the agent on a task and return (result, duration_ms)."""
    agent = create_agent(environment)
    t0 = time.time()
    run_config = RunConfig(tracing_disabled=(LLM_PROVIDER == "ollama"))
    result = await Runner.run(
        agent,
        input=instruction,
        max_turns=MAX_TURNS,
        run_config=run_config,
    )
    duration_ms = int((time.time() - t0) * 1000)
    return result, duration_ms


# ============================================================================
# FIXED ADAPTER BOUNDARY: do not modify unless the human explicitly asks.
# Harbor integration and trajectory serialization live here.
# ============================================================================

def to_atif(result: object, model: str, duration_ms: int = 0) -> dict:
    """Convert OpenAI Agents SDK RunResult to an ATIF trajectory dict."""
    steps: list[dict] = []
    step_id = 0
    now = datetime.now(timezone.utc).isoformat()

    def _step(source: str, message: str, **extra: object) -> dict:
        nonlocal step_id
        step_id += 1
        step = {
            "step_id": step_id,
            "timestamp": now,
            "source": source,
            "message": message,
        }
        step.update({key: value for key, value in extra.items() if value is not None})
        return step

    pending_tool_call = None
    for item in result.new_items:
        if isinstance(item, MessageOutputItem):
            text = ItemHelpers.text_message_output(item)
            if text:
                steps.append(_step("agent", text, model_name=model))
        elif isinstance(item, ReasoningItem):
            summaries = getattr(item.raw_item, "summary", None)
            reasoning = "\n".join(s.text for s in summaries if hasattr(s, "text")) if summaries else None
            if reasoning:
                steps.append(
                    _step(
                        "agent",
                        "(thinking)",
                        reasoning_content=reasoning,
                        model_name=model,
                    )
                )
        elif isinstance(item, ToolCallItem):
            raw = item.raw_item
            if hasattr(raw, "name"):
                pending_tool_call = raw
        elif isinstance(item, ToolCallOutputItem) and pending_tool_call:
            arguments = (
                json.loads(pending_tool_call.arguments)
                if isinstance(pending_tool_call.arguments, str)
                else pending_tool_call.arguments
            )
            output_str = str(item.output) if item.output else ""
            steps.append(
                _step(
                    "agent",
                    f"Tool: {pending_tool_call.name}",
                    tool_calls=[
                        {
                            "tool_call_id": pending_tool_call.call_id,
                            "function_name": pending_tool_call.name,
                            "arguments": arguments,
                        }
                    ],
                    observation={
                        "results": [
                            {
                                "source_call_id": pending_tool_call.call_id,
                                "content": output_str,
                            }
                        ]
                    },
                )
            )
            pending_tool_call = None

    if pending_tool_call:
        arguments = (
            json.loads(pending_tool_call.arguments)
            if isinstance(pending_tool_call.arguments, str)
            else pending_tool_call.arguments
        )
        steps.append(
            _step(
                "agent",
                f"Tool: {pending_tool_call.name}",
                tool_calls=[
                    {
                        "tool_call_id": pending_tool_call.call_id,
                        "function_name": pending_tool_call.name,
                        "arguments": arguments,
                    }
                ],
            )
        )

    if not steps:
        steps.append(_step("user", "(empty)"))

    usage = Usage()
    for response in result.raw_responses:
        usage.add(response.usage)

    return {
        "schema_version": "ATIF-v1.6",
        "session_id": getattr(result, "last_response_id", None) or "unknown",
        "agent": {"name": "autoagent", "version": "0.1.0", "model_name": model},
        "steps": steps,
        "final_metrics": {
            "total_prompt_tokens": usage.input_tokens,
            "total_completion_tokens": usage.output_tokens,
            "total_cached_tokens": getattr(usage.input_tokens_details, "cached_tokens", 0) or 0,
            "total_cost_usd": None,
            "total_steps": len(steps),
            "extra": {"duration_ms": duration_ms, "num_turns": len(result.raw_responses)},
        },
    }


class AutoAgent(BaseAgent):
    """Harbor agent adapter. Runs the OpenAI agent host-side and proxies shell into the container."""

    SUPPORTS_ATIF = True

    def __init__(self, *args, extra_env: dict[str, str] | None = None, **kwargs):
        super().__init__(*args, **kwargs)
        self._extra_env = dict(extra_env) if extra_env else {}
        for key, value in self._extra_env.items():
            os.environ.setdefault(key, value)

    @staticmethod
    def name() -> str:
        return "autoagent"

    def version(self) -> str | None:
        return "0.1.0"

    async def setup(self, environment: BaseEnvironment) -> None:
        await environment.exec(command="mkdir -p /task /task/files /task/output")
        root = _resolve_task_dir(self.logs_dir)
        if root is None:
            return

        files_dir = root / "files"
        if files_dir.is_dir():
            for file_path in files_dir.iterdir():
                if file_path.is_file():
                    await environment.upload_file(
                        source_path=file_path,
                        target_path=f"/task/files/{file_path.name}",
                    )

        shared_dir = root.parents[1] / "_shared"
        if shared_dir.is_dir():
            await environment.exec(command="mkdir -p /task/_shared")
            for file_path in shared_dir.iterdir():
                if file_path.is_file():
                    await environment.upload_file(
                        source_path=file_path,
                        target_path=f"/task/_shared/{file_path.name}",
                    )

    async def run(self, instruction: str, environment: BaseEnvironment, context: AgentContext) -> None:
        await environment.exec(command="mkdir -p /task")
        instr_file = self.logs_dir / "instruction.md"
        instr_file.write_text(instruction)
        await environment.upload_file(source_path=instr_file, target_path="/task/instruction.md")

        result, duration_ms = await run_task(environment, instruction)

        atif = to_atif(result, model=MODEL, duration_ms=duration_ms)
        traj_path = self.logs_dir / "trajectory.json"
        traj_path.write_text(json.dumps(atif, indent=2))

        try:
            final_metrics = atif.get("final_metrics", {})
            context.n_input_tokens = final_metrics.get("total_prompt_tokens", 0)
            context.n_output_tokens = final_metrics.get("total_completion_tokens", 0)
            context.n_cache_tokens = final_metrics.get("total_cached_tokens", 0)
        except Exception:
            pass

        usage = Usage()
        for response in result.raw_responses:
            usage.add(response.usage)
        print(
            f"turns={len(result.raw_responses)} duration_ms={duration_ms} "
            f"input={usage.input_tokens} output={usage.output_tokens}"
        )


__all__ = ["AutoAgent"]
