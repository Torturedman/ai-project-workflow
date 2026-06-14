import { readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { mkdir } from "node:fs/promises";

export async function writeJsonFileAtomic(path: string, data: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const tempPath = `${path}.tmp`;
  const body = `${JSON.stringify(data, null, 2)}\n`;

  await writeFile(tempPath, body, "utf8");
  await rename(tempPath, path);
}

export async function readJsonFile<TData = unknown>(path: string): Promise<TData> {
  const body = await readFile(path, "utf8");
  return JSON.parse(body) as TData;
}
