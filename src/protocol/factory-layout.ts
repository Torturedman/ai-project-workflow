import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

export interface FactoryPaths {
  factoryDir: string;
  statusFile: string;
  inputDir: string;
  planningDir: string;
  researchDir: string;
  decisionDir: string;
  architectureDir: string;
  contractsDir: string;
  tasksDir: string;
  taskFilesDir: string;
  agentsDir: string;
  reviewsDir: string;
  testsDir: string;
  startupDir: string;
  acceptanceDir: string;
  logsDir: string;
  commandLogsDir: string;
  agentLogsDir: string;
  orchestratorLog: string;
}

export function getFactoryPaths(projectDir: string): FactoryPaths {
  const factoryDir = join(projectDir, ".ai-factory");
  const inputDir = join(factoryDir, "input");
  const planningDir = join(factoryDir, "planning");
  const researchDir = join(factoryDir, "research");
  const decisionDir = join(factoryDir, "decision");
  const architectureDir = join(factoryDir, "architecture");
  const contractsDir = join(factoryDir, "contracts");
  const tasksDir = join(factoryDir, "tasks");
  const taskFilesDir = join(tasksDir, "task-files");
  const agentsDir = join(factoryDir, "agents");
  const reviewsDir = join(factoryDir, "reviews");
  const testsDir = join(factoryDir, "tests");
  const startupDir = join(factoryDir, "startup");
  const acceptanceDir = join(factoryDir, "acceptance");
  const logsDir = join(factoryDir, "logs");
  const commandLogsDir = join(logsDir, "commands");
  const agentLogsDir = join(logsDir, "agents");

  return {
    factoryDir,
    statusFile: join(factoryDir, "status.json"),
    inputDir,
    planningDir,
    researchDir,
    decisionDir,
    architectureDir,
    contractsDir,
    tasksDir,
    taskFilesDir,
    agentsDir,
    reviewsDir,
    testsDir,
    startupDir,
    acceptanceDir,
    logsDir,
    commandLogsDir,
    agentLogsDir,
    orchestratorLog: join(logsDir, "orchestrator.jsonl"),
  };
}

export async function createFactoryLayout(projectDir: string): Promise<FactoryPaths> {
  const paths = getFactoryPaths(projectDir);
  const directories = [
    paths.inputDir,
    paths.planningDir,
    paths.researchDir,
    paths.decisionDir,
    paths.architectureDir,
    paths.contractsDir,
    paths.taskFilesDir,
    paths.agentsDir,
    paths.reviewsDir,
    paths.testsDir,
    paths.startupDir,
    paths.acceptanceDir,
    paths.commandLogsDir,
    paths.agentLogsDir,
  ];

  await Promise.all(directories.map((directory) => mkdir(directory, { recursive: true })));
  await writeFile(paths.orchestratorLog, "", { flag: "a" });

  return paths;
}
