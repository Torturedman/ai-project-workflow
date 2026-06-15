import Database from "better-sqlite3";
import { mkdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export interface ProjectIndexRecord {
  id: string;
  name: string;
  root_path: string;
  current_status: string;
  selected_profile: string | null;
  active_run_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface RunIndexRecord {
  id: string;
  project_id: string;
  command: string;
  raw_request: string | null;
  status: string;
  config_snapshot_json: string;
  started_at: string;
  ended_at: string | null;
  error_code: string | null;
}

export interface TaskIndexRecord {
  id: string;
  run_id: string;
  task_key: string;
  owner: string;
  status: string;
  attempt: number;
  depends_on_json: string;
  outputs_json: string;
  created_at: string;
  updated_at: string;
}

export interface EventIndexRecord {
  project_id: string | null;
  run_id: string | null;
  task_id: string | null;
  level: string;
  event: string;
  message: string;
  data_json: string | null;
  created_at: string;
}

export interface StoredEventIndexRecord extends EventIndexRecord {
  id: number;
}

export interface ArtifactIndexRecord {
  id: string;
  run_id: string;
  kind: string;
  path: string;
  sha256: string;
  created_at: string;
}

type SqliteDatabase = InstanceType<typeof Database>;

const migrationFiles = ["001_init.sql"] as const;

export class SqliteStore {
  private constructor(private readonly db: SqliteDatabase) {}

  static async open(dbPath: string): Promise<SqliteStore> {
    await mkdir(dirname(dbPath), { recursive: true });
    const db = new Database(dbPath);
    // Foreign keys protect the global index from orphaned run/task/event rows.
    // Turning this off makes audit queries look valid while pointing at missing parents.
    db.pragma("foreign_keys = ON");
    const store = new SqliteStore(db);
    await store.applyMigrations();
    return store;
  }

  close(): void {
    this.db.close();
  }

  listTableNames(): string[] {
    return this.db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_stat%' ORDER BY name",
      )
      .pluck()
      .all() as string[];
  }

  listIndexNames(): string[] {
    return this.db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND name LIKE 'idx_%' ORDER BY name")
      .pluck()
      .all() as string[];
  }

  upsertProject(project: ProjectIndexRecord): void {
    this.db
      .prepare(
        `INSERT INTO projects (
          id, name, root_path, current_status, selected_profile, active_run_id, created_at, updated_at
        ) VALUES (
          @id, @name, @root_path, @current_status, @selected_profile, @active_run_id, @created_at, @updated_at
        )
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          root_path = excluded.root_path,
          current_status = excluded.current_status,
          selected_profile = excluded.selected_profile,
          active_run_id = excluded.active_run_id,
          updated_at = excluded.updated_at`,
      )
      .run(project);
  }

  insertRun(run: RunIndexRecord): void {
    this.db
      .prepare(
        `INSERT INTO runs (
          id, project_id, command, raw_request, status, config_snapshot_json, started_at, ended_at, error_code
        ) VALUES (
          @id, @project_id, @command, @raw_request, @status, @config_snapshot_json, @started_at, @ended_at, @error_code
        )`,
      )
      .run(run);
  }

  insertTask(task: TaskIndexRecord): void {
    this.db
      .prepare(
        `INSERT INTO tasks (
          id, run_id, task_key, owner, status, attempt, depends_on_json, outputs_json, created_at, updated_at
        ) VALUES (
          @id, @run_id, @task_key, @owner, @status, @attempt, @depends_on_json, @outputs_json, @created_at, @updated_at
        )`,
      )
      .run(task);
  }

  insertEvent(event: EventIndexRecord): void {
    this.db
      .prepare(
        `INSERT INTO events (
          project_id, run_id, task_id, level, event, message, data_json, created_at
        ) VALUES (
          @project_id, @run_id, @task_id, @level, @event, @message, @data_json, @created_at
        )`,
      )
      .run(event);
  }

  insertArtifact(artifact: ArtifactIndexRecord): void {
    this.db
      .prepare(
        `INSERT INTO artifacts (
          id, run_id, kind, path, sha256, created_at
        ) VALUES (
          @id, @run_id, @kind, @path, @sha256, @created_at
        )`,
      )
      .run(artifact);
  }

  getProject(id: string): ProjectIndexRecord | undefined {
    return this.db.prepare("SELECT * FROM projects WHERE id = ?").get(id) as ProjectIndexRecord | undefined;
  }

  getRun(id: string): RunIndexRecord | undefined {
    return this.db.prepare("SELECT * FROM runs WHERE id = ?").get(id) as RunIndexRecord | undefined;
  }

  listTasksByRun(runId: string): TaskIndexRecord[] {
    return this.db.prepare("SELECT * FROM tasks WHERE run_id = ? ORDER BY id").all(runId) as TaskIndexRecord[];
  }

  listEventsByRun(runId: string): StoredEventIndexRecord[] {
    return this.db.prepare("SELECT * FROM events WHERE run_id = ? ORDER BY id").all(runId) as StoredEventIndexRecord[];
  }

  listArtifactsByRun(runId: string): ArtifactIndexRecord[] {
    return this.db
      .prepare("SELECT * FROM artifacts WHERE run_id = ? ORDER BY id")
      .all(runId) as ArtifactIndexRecord[];
  }

  private async applyMigrations(): Promise<void> {
    for (const fileName of migrationFiles) {
      const sql = await readFile(join(import.meta.dirname, "migrations", fileName), "utf8");
      this.db.exec(sql);
    }
  }
}
