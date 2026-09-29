"use client";

import { useEffect, useState } from "react";

export function ActivateFoundingClient(props: {
  orgId: string;
  sessionId?: string;
  mode: "mock" | "live";
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [detail, setDetail] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    void (async () => {
      try {
        const res = await fetch("/api/stripe/activate-founding", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            orgId: props.orgId,
            sessionId: props.sessionId,
            mode: props.mode,
          }),
        });
        const json = (await res.json()) as { error?: string; plan?: string; locationCap?: number; note?: string };
        if (cancelled) return;
        if (!res.ok) {
          setStatus("err");
          setDetail(json.error ?? res.statusText);
          return;
        }
        setStatus("ok");
        setDetail(`Plan ${json.plan} · location cap ${json.locationCap}. ${json.note ?? ""}`);
      } catch (e) {
        if (!cancelled) {
          setStatus("err");
          setDetail(String(e));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [props.orgId, props.sessionId, props.mode]);

  if (status === "loading" || status === "idle") {
    return <p style={{ marginTop: 16 }}>Activating…</p>;
  }
  if (status === "err") {
    return (
      <p style={{ marginTop: 16, color: "#b91c1c" }}>
        Activation failed: {detail}
      </p>
    );
  }
  return (
    <p style={{ marginTop: 16, padding: "12px 14px", background: "#ecfdf5", borderRadius: 8 }}>
      {detail}
    </p>
  );
}
