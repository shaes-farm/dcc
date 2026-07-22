#!/usr/bin/env node
/**
 * The `dcc` CLI — a thin wrapper around the Next.js CLI that enforces the
 * runtime posture from spec §9 and §10.1:
 *
 *   - binds 127.0.0.1 unless --unsafe-host is passed explicitly
 *   - listens on port 7777 by default
 *   - disables Next.js telemetry for the child process
 *
 * Every package.json script routes through here so the guard cannot be
 * bypassed out of habit.
 */

import { spawn } from "node:child_process";
import { createRequire } from "node:module";

import {
  DEFAULT_PORT,
  UNSAFE_HOST_FLAG,
  checkHost,
  isLoopbackHost,
} from "./host-guard.mjs";

const SERVER_COMMANDS = new Set(["dev", "start"]);
const KNOWN_COMMANDS = new Set([...SERVER_COMMANDS, "build", "lint"]);

const require = createRequire(import.meta.url);

function usage() {
  return [
    "Usage: dcc <command> [options]",
    "",
    "Commands:",
    "  dev      Start the development server on 127.0.0.1:7777",
    "  build    Produce a production build",
    "  start    Start the production server on 127.0.0.1:7777",
    "",
    "Options:",
    "  -p, --port <port>      Port to listen on (default: 7777)",
    "  -H, --hostname <host>  Host to bind (default: 127.0.0.1, loopback only)",
    `  ${UNSAFE_HOST_FLAG}         Permit binding to a non-loopback interface`,
    "",
    "Any other options are passed through to the Next.js CLI.",
  ].join("\n");
}

function hasPortArg(argv) {
  return argv.some(
    (arg) => arg === "-p" || arg === "--port" || arg.startsWith("--port="),
  );
}

const [command, ...rest] = process.argv.slice(2);

if (!command || command === "-h" || command === "--help") {
  console.log(usage());
  process.exit(command ? 0 : 1);
}

if (!KNOWN_COMMANDS.has(command)) {
  console.error(`dcc: unknown command "${command}"\n`);
  console.error(usage());
  process.exit(1);
}

// `build` and `lint` bind nothing, so the host guard does not apply to them.
const nextArgs = [command];

if (SERVER_COMMANDS.has(command)) {
  const decision = checkHost(rest);

  if (!decision.ok) {
    console.error(`dcc: ${decision.reason}`);
    process.exit(1);
  }

  if (!isLoopbackHost(decision.host)) {
    console.warn(
      `dcc: WARNING — binding to ${decision.host}. DCC's credentials and ` +
        "actions are reachable by anything that can route to this host.",
    );
  }

  // Strip the caller's host flags; the guard's resolved host is authoritative.
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    if (arg === "-H" || arg === "--hostname") {
      i++;
      continue;
    }
    if (arg.startsWith("--hostname=") || arg === UNSAFE_HOST_FLAG) continue;
    nextArgs.push(arg);
  }

  nextArgs.push("--hostname", decision.host);
  if (!hasPortArg(rest)) nextArgs.push("--port", DEFAULT_PORT);
} else {
  nextArgs.push(...rest.filter((arg) => arg !== UNSAFE_HOST_FLAG));
}

const nextBin = require.resolve("next/dist/bin/next");

const child = spawn(process.execPath, [nextBin, ...nextArgs], {
  stdio: "inherit",
  env: {
    ...process.env,
    // §10.1: no telemetry. Set per-process rather than via the machine-global
    // `next telemetry disable`, so the guarantee travels with the repo.
    NEXT_TELEMETRY_DISABLED: "1",
  },
});

// Forward termination to the child. Without this, killing the wrapper orphans
// the Next server and leaves port 7777 held.
for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
  process.on(signal, () => {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill(signal);
    }
  });
}

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});

child.on("error", (error) => {
  console.error(`dcc: failed to start the Next.js CLI: ${error.message}`);
  process.exit(1);
});
