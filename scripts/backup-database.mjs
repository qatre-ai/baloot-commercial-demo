import { copyFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";

const databaseUrl = process.env.DATABASE_URL || "file:./db/qa.db";
if (!databaseUrl.startsWith("file:")) {
  throw new Error("backup:db currently supports only SQLite file: DATABASE_URL values");
}

const source = resolve(process.cwd(), databaseUrl.slice(5).split("?")[0]);
if (!existsSync(source)) {
  throw new Error(`Database file does not exist: ${source}`);
}

const destinationDirectory = resolve(
  process.cwd(),
  process.env.BACKUP_DIR || "backups/production",
);
mkdirSync(destinationDirectory, { recursive: true });

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const destination = resolve(
  destinationDirectory,
  `database-pre-migration-${timestamp}.db`,
);
copyFileSync(source, destination);

for (const suffix of ["-wal", "-shm"]) {
  const sidecar = `${source}${suffix}`;
  if (existsSync(sidecar)) {
    copyFileSync(sidecar, `${destination}${suffix}`);
  }
}

console.log(
  JSON.stringify(
    {
      source,
      destination,
      bytes: statSync(destination).size,
      createdAt: new Date().toISOString(),
    },
    null,
    2,
  ),
);
