import { getAjv, toErrors } from './ajv.js';
import schema from './schemas/v1/drc-result.schema.json' with { type: 'json' };
const validate = getAjv().compile(schema);
export function validateDRCResult(input) {
  const valid = validate(input);
  if (valid) {
    return { ok: true, data: input };
  } else {
    return { ok: false, errors: toErrors(validate.errors || []) };
  }
}
