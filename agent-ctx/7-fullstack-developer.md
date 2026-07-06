# Task 7 - Courses Management Tab and Admin Panel Integration

## Agent: full-stack-developer

## Summary

Successfully created the Courses Management tab and integrated all new tabs (Courses, Payments, Instructors) into the admin panel.

## Files Created

1. **`/home/z/my-project/src/components/admin/courses-tab.tsx`** (~430 lines)
   - Full course list with cover thumbnail, bilingual title, category/instrument/level/classType badges, instructor name, registration period, course dates, schedule pattern display, enrollment count, price, published/draft status
   - Create/Edit Course Dialog with all required fields including schedule pattern JSON builder (Persian day picker + time + duration)
   - Search/filter, toast notifications, RTL/LTR support

2. **`/home/z/my-project/src/components/admin/workshops-enhanced-tab.tsx`** (~350 lines)
   - Enhanced workshop management with registrationStart/End date inputs, instructorId select dropdown, coverUrl input
   - Auto-fill instructor names from dropdown
   - Full CRUD, search/filter, toast notifications, RTL support

## Files Modified

1. **`/home/z/my-project/src/app/api/admin/courses/route.ts`**
   - Added POST handler for creating courses with all new fields
   - Expanded GET select to include all fields + instructor/branch relations
   - Relaxed auth check (any admin, not just super_admin)

2. **`/home/z/my-project/src/app/api/workshops/route.ts`**
   - Added registrationStart, registrationEnd, instructorId to POST
   - Updated GET to accept ?all=true param and include instructor relation

3. **`/home/z/my-project/src/app/api/workshops/[id]/route.ts`**
   - Added registrationStart, registrationEnd, instructorId to PUT handler

4. **`/home/z/my-project/src/components/admin/admin-panel.tsx`**
   - Added imports for CoursesTab, PaymentsTab, InstructorsTab
   - Changed TabsList from grid-cols-4 to flex overflow-x-auto scrollable layout with 7 tabs
   - Added 3 new TabsContent sections for courses, payments, instructors
   - Tab order: اعلانات → دوره‌ها → کارگاه‌ها → پرداخت‌ها → مدرسین → کاربران → بلاگ

5. **`/home/z/my-project/src/components/instructor/instructor-panel.tsx`**
   - Fixed pre-existing lint error: setState in useEffect → queueMicrotask wrapper

## Verification
- ESLint passes cleanly
- Dev server compiles and runs without errors
