"use client";

import { AuthenticatedRoute } from "@/components/application-shell/authenticated-route";
import { ApplicationShell } from "@/components/application-shell/application-shell";
import { StudentDashboard } from "@/components/auth/student-dashboard";

export default function StudentApplicationPage() {
  return (
    <AuthenticatedRoute role="student">
      <ApplicationShell role="student" title="پنل هنرجو" hideSidebar>
        <StudentDashboard routeOwned />
      </ApplicationShell>
    </AuthenticatedRoute>
  );
}
