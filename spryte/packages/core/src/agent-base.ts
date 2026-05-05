import type { StructuredLogger } from "@spryte/llm";
import type { AgentTaskStatus, ApprovalRecord } from "./approval.js";

export interface AgentExecutionContext {
  structuredLog: StructuredLogger;
  timeouts: {
    defaultMs: number;
  };
}

export interface AgentRunResult<TResult, TDraft extends object> {
  result: TResult;
  /** Anything that mutates externals beyond “draft/analysis” MUST be surfaced as pending approval. */
  pendingApprovals?: Array<ApprovalRecord<TDraft>>;
  status?: AgentTaskStatus;
}

/** Contract for synchronous analysis agents (audit, scoring). Draft-only externally. */
export abstract class DraftFirstAgent<TResult, TDraft extends object> {
  abstract readonly name: string;

  /** Performs work locally; callers enforce approval before side effects. */
  abstract analyze(
    input: Record<string, unknown>,
    ctx: AgentExecutionContext,
  ): Promise<AgentRunResult<TResult, TDraft>>;
}
