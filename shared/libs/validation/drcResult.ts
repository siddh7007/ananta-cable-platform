import { getAjv, toErrors } from "./ajv.js";
import schema from "../../contracts/schemas/v1/drc-result.schema.json" assert { type: "json" };

export interface DRCResult {
  design_id: string;
  findings: Array<{
    code: string;
    message: string;
    severity: string;
  }>;
  severity_summary: {
    error: number;
    warning: number;
    info: number;
  };
}

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