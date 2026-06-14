import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { SqliteStore } from "../../src/persistence/sqlite-store.js";

const tempDirs: string[] = [];

async function createDbPath(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "ai-factory-sqlite-"));
  tempDirs.push(dir);
  return join(dir, "ai-factory.db");
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("SqliteStore", () => {
  it("applies the initial migration with required tables and indexes", async () => {
    const store = await SqliteStore.open(await createDbPath());

    try {
      const tables = store.listTableNames();
      const indexes = store.listIndexNames();

      expect(tables).toEqual([
        "agent_invocations",
        "artifacts",
        "events",
        "projects",
        "runs",
        "sqlite_sequence",
        "tasks",
      ]);
      expect(indexes).toEqual([
        "idx_agent_invocations_run_id",
        "idx_artifacts_run_id",
        "idx_events_run_id",
        "idx_runs_project_id",
        "idx_tasks_run_id",
      ]);
    } finally {
      store.close();
    }
  });

  it("writes project, run, task, event, and artifact index rows", async () => {
    const store = await SqliteStore.open(await createDbPath());
    const now = "2026-06-14T00:00:00.000Z";

    try {
      store.upsertProject({
        id: "proj_1",
        name: "Course Booking",
        root_path: "E:/workspace/course-booking",
        current_status: "executing",
        selected_profile: "node-next",
        active_run_id: "run_1",
        created_at: now,
        updated_at: now,
      });
      store.insertRun({
        id: "run_1",
        project_id: "proj_1",
        command: "create",
        raw_request: null,
        status: "running",
        config_snapshot_json: JSON.stringify({ runner: "mock" }),
        started_at: now,
        ended_at: null,
        error_code: null,
      });
      store.insertTask({
        id: "task_1",
        run_id: "run_1",
        task_key: "auth-api",
        owner: "dev-backend",
        status: "ready",
        attempt: 0,
        depends_on_json: "[]",
        outputs_json: "[\"apps/web/src/app/api/auth/route.ts\"]",
        created_at: now,
        updated_at: now,
      });
      store.insertEvent({
        project_id: "proj_1",
        run_id: "run_1",
        task_id: "task_1",
        level: "info",
        event: "task.started",
        message: "Started task",
        data_json: "{\"workspace\":\"workspaces/dev-backend\"}",
        created_at: now,
      });
      store.insertArtifact({
        id: "artifact_1",
        run_id: "run_1",
        kind: "agent-report",
        path: ".ai-factory/agents/dev-backend/report.json",
        sha256: "abc123",
        created_at: now,
      });

      expect(store.getProject("proj_1")).toMatchObject({ active_run_id: "run_1" });
      expect(store.getRun("run_1")).toMatchObject({ project_id: "proj_1", status: "running" });
      expect(store.listTasksByRun("run_1")).toHaveLength(1);
      expect(store.listEventsByRun("run_1")).toMatchObject([{ event: "task.started" }]);
      expect(store.listArtifactsByRun("run_1")).toMatchObject([{ kind: "agent-report", sha256: "abc123" }]);
    } finally {
      store.close();
    }
  });
});
