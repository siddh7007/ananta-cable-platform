#!/usr/bin/env tsx

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Simple type generator from OpenAPI schemas
// In production, you'd use openapi-typescript or similar

const generateTypes = () => {
  const openapiSpec = JSON.parse(readFileSync(join(__dirname, '../openapi.json'), 'utf-8'));

  const schemas = openapiSpec.components?.schemas || {};

  let typesCode = `// Generated types from OpenAPI specification
// These types correspond to the schemas defined in openapi.yaml

`;

  // Generate types for each schema
  Object.entries(schemas).forEach(([name, schema]: [string, any]) => {
    typesCode += generateTypeFromSchema(name, schema);
  });

  writeFileSync(join(__dirname, '../types/api.ts'), typesCode);
  console.log('Types generated successfully at packages/contracts/types/api.ts');
};

const generateTypeFromSchema = (name: string, schema: any): string => {
  if (schema.type === 'string' && schema.enum) {
    return `export type ${name} = ${schema.enum.map((v: string) => `'${v}'`).join(' | ')};\n\n`;
  }

  if (schema.type === 'object') {
    let typeDef = `export interface ${name} {\n`;

    if (schema.properties) {
      Object.entries(schema.properties).forEach(([propName, propSchema]: [string, any]) => {
        const required = schema.required?.includes(propName);
        const optional = required ? '' : '?';
        const type = getTypeFromSchema(propSchema);
        typeDef += `  ${propName}${optional}: ${type};\n`;
      });
    }

    typeDef += `}\n\n`;
    return typeDef;
  }

  return '';
};

const getTypeFromSchema = (schema: any): string => {
  if (schema.$ref) {
    const refName = schema.$ref.split('/').pop();
    return refName;
  }

  if (schema.type === 'string') {
    if (schema.enum) {
      return schema.enum.map((v: string) => `'${v}'`).join(' | ');
    }
    return 'string';
  }

  if (schema.type === 'integer') {
    return 'number';
  }

  if (schema.type === 'number') {
    return 'number';
  }

  if (schema.type === 'boolean') {
    return 'boolean';
  }

  if (schema.type === 'array') {
    const itemType = getTypeFromSchema(schema.items);
    return `${itemType}[]`;
  }

  if (schema.type === 'object') {
    if (!schema.properties) {
      return 'Record<string, any>';
    }

    let objType = '{ ';
    Object.entries(schema.properties).forEach(([propName, propSchema]: [string, any], index: number) => {
      const type = getTypeFromSchema(propSchema);
      objType += `${propName}: ${type}`;
      if (index < Object.keys(schema.properties).length - 1) {
        objType += '; ';
      }
    });
    objType += ' }';
    return objType;
  }

  return 'any';
};

generateTypes();