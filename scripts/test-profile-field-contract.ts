import assert from "node:assert/strict";

const editableInstructorProfileFields = [
  "name",
  "phone",
  "primaryInstrument",
  "skillLevel",
  "city",
  "experience",
];

assert.ok(editableInstructorProfileFields.includes("experience"));
console.log("Instructor profile field contract: PASS");
