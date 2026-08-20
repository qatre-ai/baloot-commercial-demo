import {
  getRegistrationErrorMessage,
  getPaymentStatusLabel,
  getWorkshopAvailability,
  validateStudentProfile,
} from "../src/lib/student/application-contract";

function assertEqual<T>(label: string, actual: T, expected: T): void {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, received ${String(actual)}`);
  }
}

function assertDeepEqual(label: string, actual: unknown, expected: unknown): void {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(`${label}: expected ${expectedJson}, received ${actualJson}`);
  }
}

assertDeepEqual(
  "valid profile",
  validateStudentProfile({ name: "QA Student", phone: "09120000000", email: "qa@example.com" }),
  {},
);
assertEqual(
  "invalid profile name",
  validateStudentProfile({ name: " ", phone: "09120000000", email: "qa@example.com" }).name,
  "نام الزامی است",
);
assertEqual(
  "invalid profile phone",
  validateStudentProfile({ name: "QA Student", phone: "12", email: "qa@example.com" }).phone,
  "شماره تماس معتبر نیست",
);

assertDeepEqual(
  "available workshop",
  getWorkshopAvailability({ registrationOpen: true, reservedSeats: 4, totalSeats: 10 }),
  { state: "available", remainingSeats: 6 },
);
assertDeepEqual(
  "full workshop",
  getWorkshopAvailability({ registrationOpen: true, reservedSeats: 10, totalSeats: 10 }),
  { state: "full", remainingSeats: 0 },
);
assertDeepEqual(
  "closed workshop",
  getWorkshopAvailability({ registrationOpen: false, reservedSeats: 0, totalSeats: 10 }),
  { state: "closed", remainingSeats: 10 },
);

assertEqual(
  "capacity error mapping",
  getRegistrationErrorMessage("Course has reached maximum capacity"),
  "ظرفیت کلاس تکمیل شده است",
);
assertEqual(
  "fallback error mapping",
  getRegistrationErrorMessage("unexpected"),
  "عملیات انجام نشد. دوباره تلاش کنید.",
);
assertEqual("failed payment label", getPaymentStatusLabel("failed", false), "Failed");
assertEqual("refunded payment label", getPaymentStatusLabel("refunded", true), "بازگشت داده شده");

console.log("PASS — student application contract checks");
