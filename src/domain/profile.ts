export type ArchitectureMode = "simple" | "standard" | "microservice";

export interface ProfileCommand {
  cwd: string;
  command: string;
}

export interface StackProfile {
  id: string;
  display_name: string;
  architecture_modes: ArchitectureMode[];
  backend: {
    language: string;
    framework: string;
    package_manager: string;
    root_dir: string;
    api_docs_path: string;
    healthcheck_path: string;
  };
  frontend: {
    language: string;
    framework: string;
    package_manager: string;
    root_dir: string;
    port: number;
  };
  install_command?: ProfileCommand;
  install_commands?: ProfileCommand[];
  lint_command?: ProfileCommand;
  lint_commands?: ProfileCommand[];
  test_command: ProfileCommand;
  build_command?: ProfileCommand;
  build_commands?: ProfileCommand[];
  e2e_command: ProfileCommand;
  dev_command: ProfileCommand;
  database: {
    engine: "postgresql" | "mysql" | "sqlite";
    version: string;
    orm: string;
    migration_command: string;
    seed_command?: string;
    connection_env: string;
  };
  container: {
    compose_file: string;
    up_command: string;
    down_command?: string;
  };
  template: {
    id: string;
    root: string;
  };
}
