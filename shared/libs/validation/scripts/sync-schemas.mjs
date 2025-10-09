import { mkdir, readdir, stat, cp, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const currentDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(currentDir, "../../../..");
const sourceDir = resolve(repoRoot, "shared/contracts/schemas");
const targetDir = resolve(currentDir, "../schemas");

async function ensureDir(path) {
  await mkdir(path, { recursive: true });
}

async function clearDir(path) {
  await rm(path, { recursive: true, force: true });
}

async function copySchemas() {
  const entries = await readdir(sourceDir, { withFileTypes: true });
  await ensureDir(targetDir);

  for (const entry of entries) {
    const sourcePath = resolve(sourceDir, entry.name);
    const targetPath = resolve(targetDir, entry.name);

    if (entry.isDirectory()) {
      await cp(sourcePath, targetPath, { recursive: true });
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      await cp(sourcePath, targetPath);
    }
  }
}

await clearDir(targetDir).catch(() => {});
await copySchemas();
