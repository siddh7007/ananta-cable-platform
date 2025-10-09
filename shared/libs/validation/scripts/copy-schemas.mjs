import { cp } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const currentDir = dirname(fileURLToPath(import.meta.url));
const schemasDir = resolve(currentDir, "../schemas");
const distSchemasDir = resolve(currentDir, "../dist/schemas");

await cp(schemasDir, distSchemasDir, { recursive: true });
