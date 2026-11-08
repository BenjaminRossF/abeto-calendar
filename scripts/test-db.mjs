import "dotenv/config";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!testDatabaseUrl) {
  throw new Error("Configura TEST_DATABASE_URL antes de ejecutar test:db.");
}

const parsedUrl = new URL(testDatabaseUrl);
const databaseName = decodeURIComponent(parsedUrl.pathname.replace(/^\//, ""));
if (
  parsedUrl.protocol !== "postgresql:" ||
  !["localhost", "127.0.0.1"].includes(parsedUrl.hostname) ||
  databaseName !== "abeto_calendar_test"
) {
  throw new Error(
    "test:db solo puede usar PostgreSQL local y la base abeto_calendar_test.",
  );
}

const prismaCli = resolve("node_modules/prisma/build/index.js");
const childEnvironment = {
  ...process.env,
  DATABASE_URL: testDatabaseUrl,
};

run(process.execPath, [prismaCli, "migrate", "deploy"], childEnvironment);
if (process.argv.includes("--migrate-only")) process.exit(0);
run(
  process.execPath,
  [
    "--import",
    pathToFileURL(resolve("tests/register-ts.mjs")).href,
    "--experimental-strip-types",
    "--test",
    "tests/database.test.mjs",
  ],
  childEnvironment,
);

function run(command, args, env) {
  const result = spawnSync(command, args, {
    env,
    stdio: "inherit",
    cwd: process.cwd(),
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
