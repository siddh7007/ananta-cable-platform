import { getAjv, toErrors } from "./ajv.js";
import schema from "../../contracts/schemas/v1/cable-design.schema.json" assert { type: "json" };
const validate = getAjv().compile(schema);
export function validateCableDesign(input) {
    const valid = validate(input);
    if (valid) {
        return { ok: true, data: input };
    }
    else {
        return { ok: false, errors: toErrors(validate.errors || []) };
    }
}
