import { readFileSync, writeFileSync } from 'fs';
import { load } from 'js-yaml';

const yamlContent = readFileSync('openapi.yaml', 'utf8');
const jsonContent = JSON.stringify(load(yamlContent), null, 2);
writeFileSync('openapi.json', jsonContent);
console.log('Generated openapi.json from openapi.yaml');