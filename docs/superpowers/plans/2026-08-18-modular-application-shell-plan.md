# Modular Application Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task with verification checkpoints.

**Goal:** Separate public and authenticated experiences through shared role-aware application shells without rewriting existing business logic.

**Architecture:** Keep the public homepage at `/`. Add role entry routes that render one shared `ApplicationShell` around the existing student, instructor, admin, and super-admin panels. Move role navigation and session redirects into shared contracts while preserving existing APIs and authorization.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Zustand, Tailwind CSS, Radix/shadcn primitives, Prisma SQLite QA database.

## Global Constraints

- Do not modify the public website header or marketing sections.
- Do not rewrite registration business logic, Prisma models, payment logic, enrollment logic, or existing APIs unless a browser-verified defect requires it.
- Browser validation must use `http://localhost:3010`.
- Every private route must own the full viewport and exclude public content.
- Frontend navigation visibility never replaces server-side authorization.
- Preserve existing QA accounts and interconnected QA data.
- Use `apply_patch` for source/document edits.

---

### Task 1: Add shared role and navigation contract

**Files:**
- Create: `src/lib/application-shell/contract.ts`
- Test: `scripts/test-application-shell-contract.ts`

**Interfaces:**
- `ApplicationRole = "student" | "instructor" | "admin" | "super_admin"`
- `resolveApplicationRole(user): ApplicationRole | null`
- `getRoleNavigation(role, permissions?): readonly NavigationItem[]`
- `getRoleHome(role): "/student" | "/instructor" | "/admin" | "/super-admin"`

- [ ] Define role normalization from current `User` values (`userType`, `role`).
- [ ] Define navigation items with stable IDs, labels, icons, and permission predicates.
- [ ] Keep secretary/admin navigation operational and compact.
- [ ] Add pure tests for all role mappings and privileged visibility.
- [ ] Run `npm exec tsx scripts/test-application-shell-contract.ts`.

### Task 2: Create reusable ApplicationShell UI

**Files:**
- Create: `src/components/application-shell/application-shell.tsx`
- Create: `src/components/application-shell/application-shell-header.tsx`
- Create: `src/components/application-shell/application-shell-sidebar.tsx`
- Create: `src/components/application-shell/application-shell-loading.tsx`
- Modify: `src/app/globals.css` only if shared shell tokens require it

**Interfaces:**
- `ApplicationShellProps { role, title, children, activeItem?, onNavigate?, onLogout }`

- [ ] Implement full viewport `min-h-dvh w-full` shell with no public layout imports.
- [ ] Implement desktop sidebar collapse and mobile drawer.
- [ ] Implement visible focus states, 44px targets, RTL ordering, and `prefers-reduced-motion`.
- [ ] Add role identity, current user label, and logout action.
- [ ] Add loading and error presentation without changing panel data logic.
- [ ] Run typecheck after the component compiles.

### Task 3: Add authenticated route guards

**Files:**
- Create: `src/components/application-shell/authenticated-route.tsx`
- Create: `src/app/student/page.tsx`
- Create: `src/app/instructor/page.tsx`
- Create: `src/app/admin/page.tsx`
- Create: `src/app/super-admin/page.tsx`

- [ ] Reuse `checkSession` and current session token contract.
- [ ] Render a neutral loading state while session resolution is pending.
- [ ] Redirect unauthenticated users to `/`.
- [ ] Redirect authenticated users to the canonical role route.
- [ ] Render each existing panel inside `ApplicationShell`.
- [ ] Do not import `Header`, `Footer`, `HeroSection`, or public sections into private routes.
- [ ] Run `npm run typecheck`.

### Task 4: Redirect login and logout to role routes

**Files:**
- Modify: `src/lib/auth/store.ts`
- Modify: `src/components/auth/login-modal.tsx`
- Add tests: `scripts/test-auth-routing-contract.ts`

- [ ] Add one role-home helper call after successful student, instructor, admin, and super-admin login.
- [ ] Ensure logout navigates to `/` after clearing token and state.
- [ ] Reset overlay flags during migration to prevent stale private panels on `/`.
- [ ] Preserve existing API calls and session invalidation.
- [ ] Test role destination and logout state with pure contract tests.

### Task 5: Integrate existing panels without business rewrites

**Files:**
- Modify: `src/components/auth/student-dashboard.tsx`
- Modify: `src/components/instructor/instructor-panel.tsx`
- Modify: `src/components/admin/admin-panel.tsx`
- Modify: `src/components/admin/super-admin-panel.tsx`
- Modify: `src/app/page.tsx`

- [ ] Add route-owned rendering mode so existing panels can render as shell content.
- [ ] Keep data loading, mutations, validation, and API calls unchanged.
- [ ] Remove private panel mounting from the public page after route verification.
- [ ] Keep legacy entry controls temporarily only where needed for compatibility.
- [ ] Verify the public homepage remains visually unchanged for anonymous users.

### Task 6: Registration UX-only refinement

**Files:**
- Modify: `src/components/auth/registration-form.tsx`
- Modify: `src/lib/registration/wizard.ts` only if browser evidence requires it
- Add/update: `docs/evidence/registration-ux.md`

- [ ] Preserve the existing wizard state machine and final-step logic.
- [ ] Improve step hierarchy, grouping, labels, helper text, loading, and error recovery.
- [ ] Keep the public header untouched; use only a dedicated form header if needed.
- [ ] Verify keyboard and mobile form operation before claiming UX PASS.

### Task 7: Add route and shell regression checks

**Files:**
- Create: `scripts/test-application-shell-routing.ts`
- Modify: `docs/testing/QA_RELEASE_REPORT.md`
- Modify: `docs/evidence/README.md`

- [ ] Add checks for role route mapping, anonymous denial, logout reset, and no public shell imports.
- [ ] Document evidence filenames and exact viewport/route.
- [ ] Keep untested criteria explicitly marked `NOT TESTED`.

### Task 8: Run browser QA and database regression

**Files:**
- Create: `docs/evidence/student-application-shell.png`
- Create: `docs/evidence/instructor-application-shell.png`
- Create: `docs/evidence/admin-application-shell.png`
- Create: `docs/evidence/super-admin-application-shell.png`
- Modify: `docs/testing/QA_RELEASE_REPORT.md`

- [ ] Start `npm run qa:dev` on port 3010.
- [ ] Verify anonymous public homepage.
- [ ] Verify each persistent role login and full viewport ownership.
- [ ] Verify logout, direct private URL while logged out, and browser back behavior.
- [ ] Verify registration → admin approval/rejection → student status and DB state.
- [ ] Capture console/network results and responsive viewport results.
- [ ] Run `npm run test:wizard`, `npm run test:rbac`, `npm run typecheck`, `npm run build`.

### Task 9: Create final backup and release report

**Files:**
- Modify: `docs/testing/QA_RELEASE_REPORT.md`

- [ ] Stop QA server before archiving `db/qa.db`.
- [ ] Create `D:\work\project\_Baloot_Backups\Baloot_FINAL_UI_UX_HARDENED_YYYY-MM-DD_HH-mm-ss.zip`.
- [ ] Calculate and record SHA-256 for the final backup.
- [ ] Report PASS, FAIL, and NOT TESTED separately.
- [ ] Do not declare Production Ready if any critical gate lacks evidence.
