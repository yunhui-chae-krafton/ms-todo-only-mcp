#!/usr/bin/env node

import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

let opened = false;
let copied = false;

const login = spawn(
  process.execPath,
  [resolve(projectRoot, "bin/ms-todo-mcp.mjs"), "--login"],
  {
    cwd: projectRoot,
    env: process.env,
    stdio: ["inherit", "pipe", "pipe"],
  },
);

login.stdout.on("data", (chunk) => {
  const text = chunk.toString();
  process.stdout.write(text);
  handleLoginOutput(text);
});

login.stderr.on("data", (chunk) => {
  const text = chunk.toString();
  process.stderr.write(text);
  handleLoginOutput(text);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    login.kill(signal);
  });
}

login.on("exit", (code, signal) => {
  if (signal) {
    process.exit(signal === "SIGINT" ? 130 : 143);
  }

  process.exit(code ?? 0);
});

login.on("error", (error) => {
  console.error(error.message);
  process.exit(1);
});

function handleLoginOutput(text) {
  const urls = text.match(/https?:\/\/[^\s"'<>]+/g) ?? [];
  const deviceUrl = urls.find((url) =>
    /(microsoft\.com\/(devicelogin|link)|login\.microsoft\.com\/device)/i.test(
      url,
    ),
  );

  if (deviceUrl) {
    openBrowser(deviceUrl.replace(/[),.;]+$/, ""));
  }

  const userCode = text.match(/enter the code\s+([A-Z0-9-]+)\s+to authenticate/i)?.[1];

  if (userCode) {
    copyCode(userCode);
  }
}

function openBrowser(url) {
  if (opened) {
    return;
  }

  opened = true;

  const openerArgs =
    process.env.MS_TODO_MCP_BROWSER === "default"
      ? [url]
      : ["-na", "Google Chrome", "--args", "--incognito", url];

  const opener = spawn("open", openerArgs, {
    detached: true,
    stdio: "ignore",
  });

  opener.unref();
}

function copyCode(code) {
  if (copied) {
    return;
  }

  copied = true;

  const pbcopy = spawn("pbcopy", {
    stdio: ["pipe", "ignore", "ignore"],
  });

  pbcopy.stdin.end(code);
  console.error(`\n[ms-todo] Device code copied to clipboard: ${code}\n`);
}
