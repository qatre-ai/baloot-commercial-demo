import {
  getRoleHome,
  getRoleNavigation,
  resolveApplicationRole,
} from "../src/lib/application-shell/contract";

function assertEqual<T>(label: string, actual: T, expected: T): void {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, received ${String(actual)}`);
  }
}

function assertIncludes(label: string, values: readonly string[], value: string): void {
  if (!values.includes(value)) {
    throw new Error(`${label}: expected ${value} to be present`);
  }
}

function assertExcludes(label: string, values: readonly string[], value: string): void {
  if (values.includes(value)) {
    throw new Error(`${label}: expected ${value} to be absent`);
  }
}

assertEqual("anonymous role", resolveApplicationRole(null), null);
assertEqual("student role", resolveApplicationRole({ role: "student", userType: "student" }), "student");
assertEqual("instructor role", resolveApplicationRole({ role: "instructor", userType: "student" }), "instructor");
assertEqual("secretary role", resolveApplicationRole({ role: "admin", userType: "admin" }), "admin");
assertEqual("super admin role", resolveApplicationRole({ role: "super_admin", userType: "admin" }), "super_admin");

assertEqual("student home", getRoleHome("student"), "/student");
assertEqual("instructor home", getRoleHome("instructor"), "/instructor");
assertEqual("admin home", getRoleHome("admin"), "/admin");
assertEqual("super admin home", getRoleHome("super_admin"), "/super-admin");

const studentNavigation = getRoleNavigation("student").map((item) => item.id);
assertIncludes("student navigation", studentNavigation, "classes");
assertExcludes("student navigation", studentNavigation, "security");

const secretaryNavigation = getRoleNavigation("admin", [
  { resource: "users", action: "read" },
  { resource: "enrollments", action: "read" },
]).map((item) => item.id);
assertIncludes("secretary navigation", secretaryNavigation, "pending-registrations");
assertIncludes("secretary navigation", secretaryNavigation, "registrations");
assertExcludes("secretary navigation", secretaryNavigation, "security");

const superAdminNavigation = getRoleNavigation("super_admin").map((item) => item.id);
assertIncludes("super admin navigation", superAdminNavigation, "security");
assertIncludes("super admin navigation", superAdminNavigation, "backups");
assertIncludes("super admin navigation", superAdminNavigation, "pending-registrations");

console.log("PASS — application shell role contract checks");
