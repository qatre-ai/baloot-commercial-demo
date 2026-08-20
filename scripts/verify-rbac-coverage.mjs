// Static guarantee that every permission enforced by an API route exists in the
// canonical catalog, and that the secretary role can perform its required work.
// Run: node scripts/verify-rbac-coverage.mjs
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const API_DIR = join(process.cwd(), "src", "app", "api");

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (entry.name.endsWith(".ts")) out.push(full);
  }
  return out;
}

const { PERMISSION_MATRIX, permissionsForRole } = await import(
  pathToFileURL(join(process.cwd(), "src", "lib", "auth", "permissions.ts")).href
);

const files = await walk(API_DIR);
const required = new Map();
const RE = /requireAdmin\(\s*\w+\s*,\s*["']([a-z_]+)["']\s*,\s*["']([a-z_]+)["']/g;

for (const file of files) {
  const src = await readFile(file, "utf8");
  for (const m of src.matchAll(RE)) {
    const key = `${m[1]}:${m[2]}`;
    if (!required.has(key)) required.set(key, []);
    required.get(key).push(file.replace(process.cwd() + "\\", "").replace(/\\/g, "/"));
  }
}

const missing = [];
for (const [pair, routes] of required) {
  const [resource, action] = pair.split(":");
  const actions = PERMISSION_MATRIX[resource];
  if (!actions || !actions.includes(action)) missing.push({ pair, routes });
}

console.log(`Enforced permission pairs found in API routes: ${required.size}`);
console.log(`Catalog pairs: ${Object.values(PERMISSION_MATRIX).reduce((n, a) => n + a.length, 0)}`);

if (missing.length) {
  console.error(`\nFAIL — ${missing.length} enforced pair(s) missing from catalog:`);
  for (const m of missing) console.error(`  ${m.pair}  <- ${m.routes[0]}`);
  process.exit(1);
}
console.log("PASS — every enforced permission exists in the canonical catalog.");

// Secretary must be able to run the front-desk workflow.
const sec = new Set(permissionsForRole("admin").map((p) => `${p.resource}:${p.action}`));
const MUST_HAVE = [
  "users:read", "users:approve",
  "enrollments:create", "enrollments:read", "enrollments:update",
  "payments:create", "payments:read", "payments:update",
  "students:create", "students:read", "students:update",
  "courses:read", "workshops:read", "schedules:read", "schedules:approve",
];
const secMissing = MUST_HAVE.filter((p) => !sec.has(p));
if (secMissing.length) {
  console.error(`\nFAIL — secretary role missing: ${secMissing.join(", ")}`);
  process.exit(1);
}
console.log(`PASS — secretary role holds all ${MUST_HAVE.length} front-desk permissions (${sec.size} total).`);

// Secretary must NOT hold super-admin-only powers.
const MUST_NOT = ["backups:manage", "admins:manage", "security:manage", "audit_logs:read", "settings:update"];
const leaked = MUST_NOT.filter((p) => sec.has(p));
if (leaked.length) {
  console.error(`\nFAIL — secretary must not hold: ${leaked.join(", ")}`);
  process.exit(1);
}
console.log(`PASS — secretary correctly denied ${MUST_NOT.length} privileged permissions.`);
