#!/usr/bin/env node

import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

loadEnvFile(resolve(projectRoot, ".env"));

const PACKAGE_NAME =
  process.env.MS_TODO_MCP_PACKAGE ?? "@softeria/ms-365-mcp-server@0.126.0";

const TODO_READ_ONLY_TOOLS =
  process.env.MS_TODO_MCP_TOOLS ??
  "^(list-todo-task-lists|list-todo-tasks|get-todo-task|list-todo-linked-resources)$";

const args = [
  "-y",
  PACKAGE_NAME,
  "--read-only",
  "--enabled-tools",
  TODO_READ_ONLY_TOOLS,
  "--allowed-scopes",
  "Tasks.Read",
  ...process.argv.slice(2),
];

const child = spawn("npx", args, {
  stdio: "inherit",
  env: process.env,
  cwd: projectRoot,
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    child.kill(signal);
  });
}

child.on("exit", (code, signal) => {
  if (signal) {
    process.exit(signal === "SIGINT" ? 130 : 143);
  }

  process.exit(code ?? 0);
});

child.on("error", (error) => {
  console.error(error.message);
  process.exit(1);
});

function loadEnvFile(path) {
  if (!existsSync(path)) {
    return;
  }

  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);

    if (!match) {
      continue;
    }

    const [, key, rawValue] = match;

    if (process.env[key] !== undefined) {
      continue;
    }

    process.env[key] = unquote(rawValue.trim());
  }
}

function unquote(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}
