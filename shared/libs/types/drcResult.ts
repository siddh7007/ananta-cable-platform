import { z } from "zod";

/**
 * Zod schema mirroring shared/contracts/schemas/v1/drc-result.schema.json
 */
export const DRCSeveritySchema = z.enum(["info", "warn", "error"]);

export const DRCFindingSchema = z.object({
  code: z.string(),
  message: z.string(),
  severity: DRCSeveritySchema,
  path: z.string().optional(),
});

export const DRCSeveritySummarySchema = z.object({
  info: z.number().int().nonnegative().optional(),
  warn: z.number().int().nonnegative().optional(),
  error: z.number().int().nonnegative().optional(),
});

export const DRCResultSchema = z.object({
  design_id: z.string(),
  findings: z.array(DRCFindingSchema),
  severity_summary: DRCSeveritySummarySchema,
});

export type DRCSeverity = z.infer<typeof DRCSeveritySchema>;
export type DRCFinding = z.infer<typeof DRCFindingSchema>;
export type DRCSeveritySummary = z.infer<typeof DRCSeveritySummarySchema>;
export type DRCResult = z.infer<typeof DRCResultSchema>;
