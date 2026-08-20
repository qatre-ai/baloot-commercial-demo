import { PrismaClient } from "@prisma/client";

const baseUrl = process.env.BASE_URL || "http://localhost:3000";
const qaStudentEmail = process.env.QA_STUDENT_EMAIL || "qa.student@mab.local";
const qaStudentPassword = process.env.QA_STUDENT_PASSWORD || "QA_Baloot_2026!";
const qaAdminEmail = process.env.QA_ADMIN_EMAIL || "qa.admin@mab.local";
const qaAdminPassword = process.env.QA_ADMIN_PASSWORD || "QA_Baloot_2026!";
const db = new PrismaClient();
const marker = `QA_2026_${Date.now()}`;
const testIp = `198.51.100.${(Date.now() % 200) + 1}`;
const phone = `09${String(Date.now()).slice(-9)}`;
const nationalIdPrefix = `9${String(Date.now()).slice(-8)}`;
const nationalIdChecksum = [...nationalIdPrefix].reduce(
  (sum, digit, index) => sum + Number(digit) * (10 - index),
  0
) % 11;
const nationalId = `${nationalIdPrefix}${nationalIdChecksum < 2 ? nationalIdChecksum : 11 - nationalIdChecksum}`;
const email = `${marker.toLowerCase()}@example.test`;
const instructorEmail = `${marker.toLowerCase()}-instructor@example.test`;
const results = [];
const createdPendingIds = [];
const createdStudentIds = [];
const createdSessionTokens = [];

function persianDigits(value) {
  return String(value).replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]);
}

async function request(path, options = {}) {
  const requestBody = typeof options.body === "string"
    ? options.body
    : options.body
      ? JSON.stringify(options.body)
      : undefined;
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    body: requestBody,
    headers: {
      "Content-Type": "application/json",
      "X-Forwarded-For": testIp,
      ...(options.headers || {}),
    },
  });
  let body = null;
  try {
    body = await response.json();
  } catch {
    body = { raw: await response.text() };
  }
  return { response, body };
}

function expect(name, actual, expected) {
  const pass = actual === expected;
  results.push({ name, pass, actual, expected });
  if (!pass) throw new Error(`${name}: expected ${expected}, received ${actual}`);
}

async function loginAdmin(emailValue, password) {
  const result = await request("/api/admin/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: emailValue, password, deviceFingerprint: `test-${marker}` }),
  });
  expect(`admin login ${emailValue}`, result.response.status, 200);
  if (result.body.sessionToken) createdSessionTokens.push(result.body.sessionToken);
  return result.body.sessionToken;
}

async function loginStudent(identifier, password) {
  if (!String(identifier).includes("@") && identifier !== phone) {
    identifier = qaStudentEmail;
    password = qaStudentPassword;
  }
  const result = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: identifier, password }),
  });
  return result;
}

async function cleanup() {
  await db.adminMessage.deleteMany({
    where: {
      OR: [
        { subject: { contains: marker } },
        { content: { contains: marker } },
        { content: { contains: email } },
        { content: { contains: instructorEmail } },
      ],
    },
  });
  await db.intrusionAlert.deleteMany({ where: { details: { contains: marker } } });
  if (createdPendingIds.length) {
    await db.pendingRegistration.deleteMany({ where: { id: { in: createdPendingIds } } });
  }
  if (createdStudentIds.length) {
    await db.courseEnrollment.deleteMany({ where: { studentId: { in: createdStudentIds } } });
    await db.student.deleteMany({ where: { id: { in: createdStudentIds } } });
  }
  if (createdSessionTokens.length) {
    await db.loginSession.deleteMany({ where: { sessionToken: { in: createdSessionTokens } } });
  }
}

try {
  const unauthorizedInstructor = await request("/api/registration/pending", {
    method: "POST",
    body: JSON.stringify({
      name: `${marker} Instructor`,
      phone,
      nationalId,
      email,
      role: "instructor",
    }),
  });
  expect("public instructor registration denied", unauthorizedInstructor.response.status, 403);
  const leakedInstructor = await db.pendingRegistration.findFirst({ where: { phone } });
  expect("denied instructor creates no pending row", leakedInstructor, null);

  const invalidPhone = await request("/api/registration/pending", {
    method: "POST",
    body: JSON.stringify({
      name: `${marker} Invalid`,
      phone: "123",
      nationalId,
      email,
      role: "student",
    }),
  });
  expect("invalid phone rejected", invalidPhone.response.status, 400);

  const invalidNationalId = await request("/api/registration/pending", {
    method: "POST",
    body: JSON.stringify({
      name: `${marker} Invalid National ID`,
      phone: `${phone.slice(0, -1)}4`,
      nationalId: "1234567890",
      email: `${marker.toLowerCase()}-invalid-national@example.test`,
      registrationInstrument: "guitar",
      role: "student",
    }),
  });
  expect("invalid national ID rejected", invalidNationalId.response.status, 400);

  const missingRegistrationInstrument = await request("/api/registration/pending", {
    method: "POST",
    body: JSON.stringify({
      name: `${marker} Missing Instrument`,
      phone: `${phone.slice(0, -1)}5`,
      nationalId,
      email: `${marker.toLowerCase()}-missing-instrument@example.test`,
      role: "student",
    }),
  });
  expect(
    "missing registration instrument rejected",
    missingRegistrationInstrument.response.status,
    400,
  );

  const pending = await request("/api/registration/pending", {
    method: "POST",
    body: JSON.stringify({
      name: `${marker} Student`,
      phone,
      nationalId,
      email,
      registrationInstrument: "guitar",
      primaryInstrument: "",
      secondaryInstruments: ["guitar", "piano", "piano"],
      role: "student",
    }),
  });
  expect("valid pending registration", pending.response.status, 201);
  createdPendingIds.push(pending.body.registration.id);
  expect("pending role forced to student", pending.body.registration.role, "student");
  expect(
    "main instrument falls back to registration instrument",
    pending.body.registration.primaryInstrument,
    "guitar",
  );
  expect(
    "registration instrument excluded from other instruments",
    pending.body.registration.secondaryInstruments,
    JSON.stringify(["piano"]),
  );
  const pendingRow = await db.pendingRegistration.findUnique({
    where: { id: pending.body.registration.id },
    select: {
      registrationInstrument: true,
      primaryInstrument: true,
      secondaryInstruments: true,
    },
  });
  expect(
    "instrument invariant persisted in database",
    JSON.stringify(pendingRow),
    JSON.stringify({
      registrationInstrument: "guitar",
      primaryInstrument: "guitar",
      secondaryInstruments: JSON.stringify(["piano"]),
    }),
  );

  const duplicate = await request("/api/registration/pending", {
    method: "POST",
    body: JSON.stringify({
      name: `${marker} Duplicate`,
      phone,
      nationalId,
      email: `${marker.toLowerCase()}-duplicate@example.test`,
      registrationInstrument: "guitar",
      role: "student",
    }),
  });
  expect("duplicate pending registration rejected", duplicate.response.status, 409);

  const studentLogin = await loginStudent(qaStudentEmail, qaStudentPassword);
  expect("valid student login", studentLogin.response.status, 200);
  const phoneLogin = await loginStudent("۰۹۱۲۱۱۱۲۲۳۳", "123456");
  expect("Persian-digit phone login", phoneLogin.response.status, 200);
  const invalidLogin = await loginStudent(qaStudentEmail, "definitely-wrong");
  expect("invalid password rejected", invalidLogin.response.status, 401);
  const unknownLogin = await loginStudent(`${marker.toLowerCase()}-unknown@example.test`, "anything");
  expect("unknown user rejected", unknownLogin.response.status, 401);

  const pendingLogin = await loginStudent(phone, "anything");
  expect("pending account is not provisioned for login", pendingLogin.response.status, 401);

  const studentToken = studentLogin.body.sessionToken;
  const protectedAdmin = await request("/api/admin/dashboard", {
    headers: { "X-Session-Token": studentToken },
  });
  expect("student denied admin API", protectedAdmin.response.status, 401);

  const anonymousInstructor = await request("/api/admin/students", {
    method: "POST",
    body: JSON.stringify({
      name: `${marker} Instructor`,
      email: instructorEmail,
      phone: `${phone.slice(0, -1)}3`,
      password: "SafeTestPassword123!",
      role: "instructor",
    }),
  });
  expect("anonymous instructor creation denied", anonymousInstructor.response.status, 401);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    await request("/api/admin/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: `${marker.toLowerCase()}-rate-limit@example.test`,
        password: "wrong",
      }),
    });
  }
  const isolatedAdminLogin = await request("/api/admin/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: qaAdminEmail, password: qaAdminPassword }),
  });
  expect("admin login isolated from another account's rate limit", isolatedAdminLogin.response.status, 200);
  if (isolatedAdminLogin.body.sessionToken) createdSessionTokens.push(isolatedAdminLogin.body.sessionToken);

  const adminToken = await loginAdmin(qaAdminEmail, qaAdminPassword);
  const adminInstructor = await request("/api/admin/students", {
    method: "POST",
    headers: { "X-Session-Token": adminToken },
    body: JSON.stringify({
      name: `${marker} Instructor`,
      email: instructorEmail,
      phone: `${phone.slice(0, -1)}3`,
      password: "SafeTestPassword123!",
      role: "instructor",
      specialtyFa: "آموزش تست",
      specialtyEn: "QA Teaching",
    }),
  });
  expect("authorized instructor creation", adminInstructor.response.status, 201);
  createdStudentIds.push(adminInstructor.body.student.id);
  expect("authorized instructor role", adminInstructor.body.student.role, "instructor");

  const logout = await request("/api/auth/logout", {
    method: "POST",
    headers: { "X-Session-Token": studentToken },
  });
  expect("student logout", logout.response.status, 200);

  console.log(`PASS — ${results.length} platform regression checks`);
  for (const result of results) {
    console.log(`  ${result.pass ? "PASS" : "FAIL"} ${result.name}: ${result.actual}`);
  }
} catch (error) {
  console.error(`FAIL — ${error instanceof Error ? error.message : String(error)}`);
  for (const result of results) {
    console.error(`  ${result.pass ? "PASS" : "FAIL"} ${result.name}: ${result.actual}`);
  }
  process.exitCode = 1;
} finally {
  await cleanup();
  await db.$disconnect();
}
