import assert from "node:assert/strict";
import { uniqueById } from "../src/lib/instructor/collection-contract";

const items = [
  { id: "schedule-a", title: "first" },
  { id: "schedule-a", title: "duplicate" },
  { id: "", title: "empty" },
  { id: "   ", title: "whitespace" },
  { id: "schedule-b", title: "second" },
];

assert.deepEqual(uniqueById(items), [
  { id: "schedule-a", title: "first" },
  { id: "schedule-b", title: "second" },
]);

console.log("Instructor collection contract: PASS");
