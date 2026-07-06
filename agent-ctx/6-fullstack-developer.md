# Task 6 - Enrollment & Payment API Routes

## Agent: full-stack-developer

## Task
Implement enrollment & payment API routes with registration method, tuition tracking, and gateway support for the Mehr Avaye Balout music institution website.

## Files Created/Updated

### Updated Files
1. `/src/app/api/student/enrollments/route.ts`
   - GET: Added payments relation to enrollment response
   - POST: Added registrationMethod="online", paymentStatus="pending_gateway", tuitionAmount from course price, registration open/timeframe checks, maxCapacity check

2. `/src/app/api/admin/payments/route.ts`
   - Fixed non-existent Prisma relations (removed `ticket` and `admin` includes that don't exist in schema)
   - Added manual ticketInfo lookup for payments with ticketId
   - Added `type` field population (course/workshop/other) in payment creation
   - Kept installment plan creation working with new schema

3. `/src/app/api/admin/payments/[id]/route.ts`
   - Fixed non-existent relations (removed `ticket`, `admin`, and `classType` references)
   - Added manual ticketInfo lookup
   - Fixed enrollment select fields (paymentStatus, tuitionAmount, registrationMethod)

4. `/src/app/api/workshops/[id]/purchase/route.ts`
   - Added registrationMethod="online" for online purchases
   - Added registrationOpen and timeframe checks
   - Changed initial status to "pending_payment" (from "reserved")
   - Added discount price support

### Created Files
5. `/src/app/api/admin/enrollments/route.ts`
   - GET: List all enrollments with comprehensive filters (status, paymentStatus, registrationMethod, courseId, studentId, search, date range)
   - POST: Create enrollment on behalf of student (phone/in_person), with paymentStatus and tuitionAmount, registeredByAdminId tracking, audit logging

6. `/src/app/api/admin/enrollments/[id]/route.ts`
   - GET: Full enrollment details with student, course, payments, installment plans
   - PATCH: Update enrollment with admin edit tracking (lastEditedByAdminId, lastEditedAt), payment status change handling
   - DELETE: Soft delete (status → "dropped") with audit log

7. `/src/app/api/payments/gateway/route.ts`
   - POST: Initialize payment for online registration (enrollmentId or ticketId), creates Payment record, sets gateway authority, returns mock gateway URL

8. `/src/app/api/payments/gateway/verify/route.ts`
   - POST: Verify payment after gateway callback, handles success/failure, updates Payment + Enrollment/Ticket accordingly

## Key Design Decisions
- Payment model has no `ticket` or `admin` Prisma relations — ticketInfo is fetched manually via separate query
- Online enrollment defaults: registrationMethod="online", paymentStatus="pending_gateway"
- Admin enrollment: must specify phone/in_person, can set paymentStatus and tuitionAmount
- Gateway is a placeholder — returns mock URLs for future integration
- Soft delete pattern for enrollments (status → "dropped") preserves data integrity
- All admin actions logged with AuditLog entries including IP and user agent
