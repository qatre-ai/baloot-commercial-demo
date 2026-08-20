import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(
  resolve("src/components/instructor/instructor-panel.tsx"),
  "utf8"
);

const mainPanelStart = source.indexOf('className={routeOwned ? "h-full');
const dialogsStart = source.indexOf("{/* Create Request Dialog */}");
const outerPresenceStart = source.lastIndexOf("<AnimatePresence>", mainPanelStart);
const outerPresenceEnd = source.indexOf("</AnimatePresence>", dialogsStart);

assert.equal(
  outerPresenceStart === -1 || outerPresenceEnd < dialogsStart,
  true,
  "The main panel and dialogs must not be unkeyed siblings of one AnimatePresence."
);

console.log("Instructor AnimatePresence contract: PASS");
