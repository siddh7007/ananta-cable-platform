import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import type { ValidateFunction } from 'ajv';

// Import OpenAPI schemas
import openapiSpec from '../../../contracts/openapi.json' assert { type: 'json' };

const ajv = new Ajv({
  allErrors: true,
  coerceTypes: true,
  useDefaults: true,
  removeAdditional: 'failing',
  strict: false,
});
addFormats(ajv);

// Extract schemas from OpenAPI spec
const schemas = openapiSpec.components?.schemas || {};

// Compile validators for request/response schemas
export const validators = {
  // Data model validators
  Region: ajv.compile(schemas.Region),
  ConnectorSummary: ajv.compile(schemas.ConnectorSummary),
  ConnectorMetadata: ajv.compile(schemas.ConnectorMetadata),
  TerminationType: ajv.compile(schemas.TerminationType),
  AssemblyStep1: ajv.compile(schemas.AssemblyStep1),
  Endpoint: ajv.compile(schemas.Endpoint),
  AssemblyDraft: ajv.compile(schemas.AssemblyDraft),
  AssemblyDraftResponse: ajv.compile(schemas.AssemblyDraftResponse),
  NotesPack: ajv.compile(schemas.NotesPack),
  LocaleColors: ajv.compile(schemas.LocaleColors),
  DRCRuleset: ajv.compile(schemas.DRCRuleset),
  DRCRulesetsResponse: ajv.compile(schemas.DRCRulesetsResponse),
  DRCRunRequest: ajv.compile(schemas.DRCRunRequest),
  DRCApplyFixesRequest: ajv.compile(schemas.DRCApplyFixesRequest),
  DRCApplyFixesResponse: ajv.compile(schemas.DRCApplyFixesResponse),
  DRCFinding: ajv.compile(schemas.DRCFinding),
  DRCFix: ajv.compile(schemas.DRCFix),
  DRCReport: ajv.compile(schemas.DRCReport),
} as const;

export type Validators = typeof validators;

/**
 * Validate data against a schema
 */
export function validate<T = any>(
  validator: ValidateFunction<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const valid = validator(data);
  if (valid) {
    return { success: true, data: data as T };
  }

  const errors = validator.errors?.map(err => {
    const path = err.instancePath || 'root';
    const message = err.message || 'Unknown error';
    return `${path}: ${message}`;
  }) || ['Unknown validation error'];

  return { success: false, errors };
}

/**
 * Middleware function for Fastify to validate request/response
 */
export function createValidationMiddleware(validator: ValidateFunction) {
  return function (data: unknown) {
    const result = validate(validator, data);
    if (!result.success) {
      const error = new Error(`Validation failed: ${result.errors.join(', ')}`);
      (error as any).statusCode = 400;
      throw error;
    }
    return result.data;
  };
}
