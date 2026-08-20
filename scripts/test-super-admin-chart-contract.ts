import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(
  resolve("src/components/admin/super-admin-panel.tsx"),
  "utf8"
);

const dashboardStart = source.indexOf("function DashboardTab(");
const dashboardEnd = source.indexOf("\nfunction ", dashboardStart + 1);
const dashboardSource = source.slice(
  dashboardStart,
  dashboardEnd === -1 ? source.length : dashboardEnd
);

assert.equal(
  dashboardSource.includes("const CustomTooltip ="),
  false,
  "Chart tooltip components must be declared outside DashboardTab."
);

console.log("Super-admin chart component contract: PASS");
