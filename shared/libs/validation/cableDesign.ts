import { getAjv, toErrors } from "./ajv.js";
import schema from "./schemas/v1/cable-design.schema.json" assert { type: "json" };
import type { CableDesign } from "@cable-platform/types";

export type { CableDesign } from "@cable-platform/types";

const validate = getAjv().compile(schema);

export function validateCableDesign(input: unknown): 
  | { ok: true; data: CableDesign } 
  | { ok: false; errors: Array<{ path: string; message: string }> } 
{
  const valid = validate(input);
  if (valid) {
    return { ok: true, data: input as unknown as CableDesign };
  } else {
    return { ok: false, errors: toErrors(validate.errors || []) };
  }
}
