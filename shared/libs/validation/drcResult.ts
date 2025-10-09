import { getAjv, toErrors } from "./ajv.js";
import schema from "./schemas/v1/drc-result.schema.json" assert { type: "json" };
import type {
  DRCResult,
  DRCFinding,
  DRCSeverity,
  DRCSeveritySummary,
} from "@cable-platform/types";

export type {
  DRCResult,
  DRCFinding,
  DRCSeverity,
  DRCSeveritySummary,
} from "@cable-platform/types";

const validate = getAjv().compile(schema);

export function validateDRCResult(input: unknown):
  | { ok: true; data: DRCResult }
  | { ok: false; errors: Array<{ path: string; message: string }> }
{
  const valid = validate(input);
  if (valid) {
    return { ok: true, data: input as unknown as DRCResult };
  } else {
    return { ok: false, errors: toErrors(validate.errors || []) };
  }
}
