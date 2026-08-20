import assert from "node:assert/strict";

type Enrollment = {
  tuitionAmount: number | null;
  course: { price: number | null };
};

const effectiveTuition = (enrollment: Enrollment) =>
  enrollment.tuitionAmount ?? enrollment.course.price ?? 0;

const fixtures: Enrollment[] = [
  { tuitionAmount: null, course: { price: 6_300_000 } },
  { tuitionAmount: 2_000_000, course: { price: 6_300_000 } },
  { tuitionAmount: null, course: { price: null } },
];

assert.equal(fixtures.reduce((sum, enrollment) => sum + effectiveTuition(enrollment), 0), 8_300_000);
assert.equal(effectiveTuition(fixtures[0]), 6_300_000);
assert.equal(effectiveTuition(fixtures[2]), 0);

console.log("Student payment contract checks passed.");
