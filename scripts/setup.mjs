#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

function run(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, {
    cwd: root,
    stdio: "inherit",
    shell: false,
    ...opts,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function hasDocker() {
  const result = spawnSync("docker", ["info"], { stdio: "ignore" });
  return result.status === 0;
}

console.log("Motor de Reservas — setup local\n");

if (!existsSync(resolve(root, ".env"))) {
  console.error("Missing .env — copy .env.example to .env first.");
  process.exit(1);
}

if (hasDocker()) {
  console.log("Starting PostgreSQL (docker compose)...");
  run("docker", ["compose", "up", "-d", "db"]);
  console.log("Waiting for database...");
  for (let i = 0; i < 30; i++) {
    const check = spawnSync(
      "docker",
      ["compose", "exec", "-T", "db", "pg_isready", "-U", "postgres", "-d", "motor_reservas"],
      { cwd: root, stdio: "ignore" },
    );
    if (check.status === 0) break;
    spawnSync("sleep", ["1"]);
  }
} else {
  console.warn("Docker not available — ensure DATABASE_URL points to a running Postgres.");
}

console.log("Syncing database schema...");
run("npx", ["prisma", "db", "push"]);

console.log("Seeding demo data...");
run("npx", ["tsx", "prisma/seed.ts"]);

console.log("\nSetup complete. Run: npm run dev");
