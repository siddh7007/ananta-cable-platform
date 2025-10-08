import { createRequire } from "module";
import { getAjv, toErrors } from "./ajv.js";
const require = createRequire(import.meta.url);
const schema = require("../../contracts/schemas/v1/cable-design.schema.json");
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
