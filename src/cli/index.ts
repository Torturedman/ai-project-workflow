import { Command } from "commander";
import { fileURLToPath } from "node:url";

export function buildCli(): Command {
  const program = new Command();

  program
    .name("ai-factory")
    .description("Local AI software factory workflow orchestrator")
    .version("0.1.0");

  program.command("doctor").description("Check local environment readiness");
  program.command("profiles").description("Manage and inspect stack profiles");

  return program;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  buildCli().parse(process.argv);
}
