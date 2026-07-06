# Task 6: Add Registrations Tab to Admin Panel

## Agent: Sub-agent (full-stack-developer)
## Status: COMPLETED

## Summary
Added a comprehensive "Registrations" (ثبت‌نام‌ها) tab to the admin panel with enrollment management, payment tracking, registration controls, and admin guide documentation.

## Changes Made

### 1. New Types & Constants
- **Enrollment interface** (lines 158-206): Full type definition including student, course, payments, registration/payment fields
- **PAYMENT_STATUS_CONFIG** (lines 211-217): 5 payment statuses with Farsi/English labels and colors
- **REGISTRATION_METHOD_CONFIG** (lines 219-223): 3 methods (online/phone/in_person) with icons and colors
- **ENROLLMENT_STATUS_CONFIG** (lines 225-231): 5 enrollment statuses with labels and colors

### 2. EnrollmentEditDialog Component (lines 1230-1440)
- Read-only display of student name, course, registration method
- Payment status dropdown (paid/unpaid/partial/waived - excludes pending_gateway)
- Tuition amount input (تومان)
- Payment due date input
- Payment reference input
- Notes textarea
- Enrollment status dropdown (active/completed/paused/dropped/pending_payment)
- "Mark as Paid" quick action button (green, only shown when not paid)
- Save button calling PATCH /api/admin/enrollments/[id]
- Uses comparison-based form sync (prevEnrollmentId) to avoid lint error

### 3. WorkshopForm Registration Controls
- Added `registrationOpen` switch (default ON) in Settings tab
- Added `registrationOpenAt` date input (شروع ثبت‌نام)
- Added `registrationCloseAt` date input (پایان ثبت‌نام)
- All within a bordered "تنظیمات ثبت‌نام" section with UserPlus icon

### 4. AdminPanel State & Handlers
- New state: enrollments, enrollmentStats, courses, enrollmentSearch, enrollmentPayFilter, enrollmentMethodFilter, enrollmentCourseFilter
- New dialog states: isEnrollmentEditDialogOpen, editingEnrollment, isEnrollmentViewDialogOpen, viewingEnrollment, isNewRegistrationOpen
- fetchEnrollments: GET /api/admin/enrollments?limit=100
- fetchCourses: GET /api/admin/courses?all=true
- handleSaveEnrollment: PATCH /api/admin/enrollments/[id]
- handleDropEnrollment: DELETE /api/admin/enrollments/[id] (soft delete)
- Updated fetchAll to include both new fetch functions

### 5. Registrations Tab Content
- **New Registration button** with UserPlus icon
- **Summary stats bar**: 6 stat boxes (Total/Paid/Unpaid/Partial/Waived/Pending Gateway) with color coding
- **Filters**: Search input + 3-column filter row (payment status, registration method, course)
- **Enrollment cards**: Student name, payment badge, course title, method badge, status badge, tuition amount, enrollment date, View/Edit/Drop buttons
- **Client-side filtering**: All filters applied in render with IIFE pattern

### 6. Enrollment Dialogs
- **View Dialog**: Full enrollment details grid with payments history
- **Edit Dialog**: EnrollmentEditDialog component (see above)
- **New Registration**: Opens RegistrationForm component with isAdminMode=true

### 7. Admin Guide Section
- Added "ثبت‌نام و پرداخت" (Registration & Payment) section with CreditCard icon
- 6 field descriptions: registrationMethod, tuitionAmount, paymentStatus, registrationOpen, paymentDueDate, paymentRef

### 8. Tab Layout
- Changed from grid-cols-5 to grid-cols-6
- Tab order: Announcements, Workshops, **Registrations**, Users, Blog, Guide

## Files Modified
- `/home/z/my-project/src/components/admin/admin-panel.tsx` (major update)
- `/home/z/my-project/worklog.md` (appended work log)

## Lint & Dev Server
- Zero lint errors
- Dev server running clean with no compilation errors
