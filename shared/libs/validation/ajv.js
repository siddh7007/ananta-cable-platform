import Ajv from "ajv";
import addFormats from "ajv-formats";
import cableDesignSchema from "../../contracts/schemas/v1/cable-design.schema.json" assert { type: "json" };
import drcResultSchema from "../../contracts/schemas/v1/drc-result.schema.json" assert { type: "json" };
let _ajv = null;
export function getAjv() {
    if (_ajv)
        return _ajv;
    const ajv = new Ajv({
        strict: true,
        allErrors: true,
        allowUnionTypes: true
    });
    // Add draft 2020-12 meta schema
    ajv.addMetaSchema({
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://json-schema.org/draft/2020-12/schema",
        "title": "Core and Validation Specifications",
        "type": "object",
        "properties": {
            "$schema": { "type": "string", "format": "uri" },
            "$id": { "type": "string", "format": "uri" },
            "title": { "type": "string" },
            "type": { "type": "string", "enum": ["object", "array", "string", "number", "boolean", "null"] },
            "properties": { "type": "object" },
            "required": { "type": "array", "items": { "type": "string" } },
            "additionalProperties": { "type": "boolean" }
        }
    });
    try {
        addFormats(ajv);
    }
    catch {
        // Ignore errors from addFormats - some formats may not be available
    }
    // Add schemas for Fastify $ref usage
    ajv.addSchema(cableDesignSchema, 'cable-design.json');
    ajv.addSchema(drcResultSchema, 'drc-result.json');
    _ajv = ajv;
    return ajv;
}
export function toErrors(errs = []) {
    return errs.map(e => ({
        path: e.instancePath || e.schemaPath || "",
        message: e.message || "invalid"
    }));
}
