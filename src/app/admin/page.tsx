"use client";

import { AuthenticatedRoute } from "@/components/application-shell/authenticated-route";
import { ApplicationShell } from "@/components/application-shell/application-shell";
import { AdminPanel } from "@/components/admin/admin-panel";

export default function AdminApplicationPage() {
  return (
    <AuthenticatedRoute role="admin">
      <ApplicationShell role="admin" title="پنل مدیریت آموزشگاه" hideSidebar>
        <AdminPanel routeOwned />
      </ApplicationShell>
    </AuthenticatedRoute>
  );
}
