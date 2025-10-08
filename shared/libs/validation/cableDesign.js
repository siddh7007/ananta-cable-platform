import { getAjv, toErrors } from "./ajv.js";

// Define cable design schema inline
const schema = {
  type: 'object',
  properties: {
    cable: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        length: { type: 'number' },
        length_unit: { type: 'string' }
      }
    },
    conductors: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          gauge: { type: 'string' },
          color: { type: 'string' }
        }
      }
    },
    endpoints: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          type: { type: 'string' }
        }
      }
    },
    bom: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          type: { type: 'string' },
          mpn: { type: 'string' },
          quantity: { type: 'integer' }
        }
      }
    },
    labels: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          text: { type: 'string' },
          position: { type: 'string' }
        }
      }
    }
  },
  required: ['cable', 'conductors', 'endpoints', 'bom', 'labels']
};

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
