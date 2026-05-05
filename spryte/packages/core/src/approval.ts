import { z } from "zod";

export const AgentTaskStatusSchema = z.enum([
  "pending_approval",
  "approved",
  "rejected",
  "executed",
  "failed",
]);

export type AgentTaskStatus = z.infer<typeof AgentTaskStatusSchema>;

/** Domain shape for drafts awaiting human gate (persisted rows use DB ids). */
export interface PendingDraft<TDraft> {
  status: Extract<AgentTaskStatus, "pending_approval">;
  draft: TDraft;
  createdAtIso: string;
}

export interface ApprovalRecord<TDraft> {
  status: AgentTaskStatus;
  draft: TDraft;
  approvedBy?: string;
  executedAtIso?: string;
  rejectedReason?: string;
}
