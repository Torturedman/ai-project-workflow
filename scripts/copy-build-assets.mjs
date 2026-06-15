import { copyFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));

const buildAssets = [
  {
    source: join(repoRoot, "src", "persistence", "migrations", "001_init.sql"),
    target: join(repoRoot, "dist", "persistence", "migrations", "001_init.sql"),
  },
];

for (const asset of buildAssets) {
  // Build-time asset copying is intentionally allowlisted: expanding this list changes
  // the runtime package surface and can ship resource files that were meant to stay local.
  await mkdir(dirname(asset.target), { recursive: true });
  await copyFile(asset.source, asset.target);
}
