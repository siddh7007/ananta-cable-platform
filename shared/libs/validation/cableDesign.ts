import { getAjv, toErrors } from "./ajv.js";
import schema from "../../contracts/schemas/v1/cable-design.schema.json" assert { type: "json" };

export interface CableDesign {
  id: string;
  name: string;
  cores: number;
}

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