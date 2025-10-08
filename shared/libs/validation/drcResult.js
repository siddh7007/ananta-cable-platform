import { getAjv, toErrors } from "./ajv.js";

// Define DRC result schema inline (matches the schema in DRC routes)
const schema = {
  type: 'object',
  properties: {
    assembly_id: { type: 'string' },
    ruleset_id: { type: 'string' },
    version: { type: 'string' },
    passed: { type: 'boolean' },
    errors: { type: 'integer', minimum: 0 },
    warnings: { type: 'integer', minimum: 0 },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          severity: { enum: ['error', 'warning', 'info'] },
          domain: { enum: ['mechanical', 'electrical', 'standards', 'labeling', 'consistency'] },
          code: { type: 'string' },
          message: { type: 'string' },
          where: { type: 'string' },
          refs: { type: 'array', items: { type: 'string' } }
        },
        required: ['id', 'severity', 'domain', 'code', 'message']
      }
    },
    fixes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          label: { type: 'string' },
          description: { type: 'string' },
          domain: { enum: ['mechanical', 'electrical', 'standards', 'labeling', 'consistency'] },
          applies_to: { type: 'array', items: { type: 'string' } }
        },
        required: ['id', 'label', 'description', 'domain']
      }
    }
  },
  required: ['assembly_id', 'ruleset_id', 'version', 'passed', 'errors', 'warnings', 'findings', 'fixes']
};

const validate = getAjv().compile(schema);
export function validateDRCResult(input) {
    const valid = validate(input);
    if (valid) {
        return { ok: true, data: input };
    }
    else {
        return { ok: false, errors: toErrors(validate.errors || []) };
    }
}
