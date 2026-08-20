"use client";

import { AuthenticatedRoute } from "@/components/application-shell/authenticated-route";
import { ApplicationShell } from "@/components/application-shell/application-shell";
import { SuperAdminPanel } from "@/components/admin/super-admin-panel";

export default function SuperAdminApplicationPage() {
  return (
    <AuthenticatedRoute role="super_admin">
      <ApplicationShell role="super_admin" title="پنل سوپر ادمین" hideSidebar>
        <SuperAdminPanel isOpen onClose={() => undefined} />
      </ApplicationShell>
    </AuthenticatedRoute>
  );
}
