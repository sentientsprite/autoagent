import { z } from "zod";

export const AuditScoresSchema = z.object({
  gbp: z.number().min(0).max(10),
  seo: z.number().min(0).max(10),
  mobile: z.number().min(0).max(10),
  content: z.number().min(0).max(10),
  reviews: z.number().min(0).max(10),
  headline: z.string().max(400).optional(),
  highlights: z.array(z.string().min(1).max(400)).max(12).optional(),
  actions: z.array(z.string().min(1).max(400)).max(12).optional(),
});

export type AuditScores = z.infer<typeof AuditScoresSchema>;

export const FreeAuditInputSchema = z.object({
  url: z.string().min(3).max(2048),
  city: z.string().min(2).max(120).optional(),
  businessName: z.string().min(1).max(200).optional(),
});

export type FreeAuditInput = z.infer<typeof FreeAuditInputSchema>;

export const FreeAuditResultSchema = z.object({
  url: z.string().url(),
  city: z.string().optional(),
  businessName: z.string().optional(),
  scores: AuditScoresSchema,
  evidence: z.object({
    pinchTab: z.boolean(),
    directFetch: z.boolean(),
    notes: z.array(z.string()).max(20).optional(),
  }),
  model: z.object({
    provider: z.enum(["anthropic", "mlx"]),
    latencyMs: z.number().nonnegative(),
    estimatedCostUsd: z.number().nonnegative(),
  }),
});

export type FreeAuditResult = z.infer<typeof FreeAuditResultSchema>;
