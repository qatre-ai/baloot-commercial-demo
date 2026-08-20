"use client";

import { AuthenticatedRoute } from "@/components/application-shell/authenticated-route";
import { ApplicationShell } from "@/components/application-shell/application-shell";
import InstructorPanel from "@/components/instructor/instructor-panel";

export default function InstructorApplicationPage() {
  return (
    <AuthenticatedRoute role="instructor">
      <ApplicationShell role="instructor" title="پنل مدرس" hideSidebar>
        <InstructorPanel routeOwned />
      </ApplicationShell>
    </AuthenticatedRoute>
  );
}
