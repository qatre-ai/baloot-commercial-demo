# Task 5 - Testimonial API Routes Agent

## Task: Create 3 API route files for the Testimonial system

## Work Log:

- Read worklog.md (Tasks 1-8) for full project context
- Read Prisma schema v6.0 — confirmed Testimonial model exists with all required fields
- Read auth session.ts — confirmed getSession, getClientIp, getUserAgent are available
- Created `/src/app/api/testimonials/route.ts` (public GET + POST)
- Created `/src/app/api/admin/testimonials/route.ts` (admin GET + POST)
- Created `/src/app/api/admin/testimonials/[id]/route.ts` (admin PUT + DELETE)
- ESLint passes on all 3 new files with 0 errors
- Pre-existing lint error in contact.tsx (AlertCircle not defined) is unrelated
- Dev server running with 200 responses

## Files Created:

1. **`/src/app/api/testimonials/route.ts`** — Public API
   - GET: Fetch published testimonials with limit, featured filter, ordered by isFeatured desc → displayOrder asc → createdAt desc
   - POST: Submit new testimonial with validation (name, email, contentFa required), email regex check, rating clamped 1-5, defaults to pending/unpublished

2. **`/src/app/api/admin/testimonials/route.ts`** — Admin API
   - GET: List all testimonials (including unpublished), filter by status, pagination with limit/offset, returns pendingCount
   - POST: Admin creates testimonial manually, source='admin_added', audit log created with admin action

3. **`/src/app/api/admin/testimonials/[id]/route.ts`** — Admin detail API
   - PUT: Update testimonial with action-based workflow:
     - approve: sets isApproved=true, status=approved, approvedBy/approvedAt
     - reject: sets isApproved=false, isPublished=false, status=rejected, optional rejectionReason
     - publish: requires approval first (super_admin can bypass), sets isPublished=true, status=published
     - unpublish: sets isPublished=false, status=approved
     - general update: updates individual fields (name, email, rating, content, etc.)
   - DELETE: Super admin only, hard delete with audit log (severity: warning)

## Verification:
- All 3 files match Prisma schema v6.0 Testimonial model exactly
- Auth checks: session.userType === 'admin' for admin routes, session.role === 'super_admin' for DELETE
- Audit logging for all admin write operations
- ESLint: 0 errors on new files
