import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { access } from "node:fs/promises";
import { constants } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Writable } from "node:stream";

export interface ArtifactIndexInput {
  id: string;
  runId: string;
  kind: string;
  path: string;
  absolutePath: string;
  createdAt: string;
}

export interface ArtifactIndexRecord {
  id: string;
  run_id: string;
  kind: string;
  path: string;
  sha256: string;
  created_at: string;
}

export async function hashFileSha256(path: string): Promise<string> {
  const hash = createHash("sha256");
  const sink = new Writable({
    write(chunk, _encoding, callback) {
      hash.update(chunk);
      callback();
    },
  });

  await pipeline(createReadStream(path), sink);
  return hash.digest("hex");
}

export async function createArtifactIndexRecord(input: ArtifactIndexInput): Promise<ArtifactIndexRecord> {
  await access(input.absolutePath, constants.F_OK);

  return {
    id: input.id,
    run_id: input.runId,
    kind: input.kind,
    path: input.path,
    sha256: await hashFileSha256(input.absolutePath),
    created_at: input.createdAt,
  };
}
