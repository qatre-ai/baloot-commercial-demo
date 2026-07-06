# Task 7 - Add Registrations Tab to Super Admin Panel

## Summary
Successfully added a comprehensive "Registrations" (ثبت‌نام‌ها) tab to the super admin panel with enrollment management, warning system, and payment gateway tracking.

## Changes Made

### File: `/home/z/my-project/src/components/admin/super-admin-panel.tsx`
- **Lines grew from 2263 → 3243 (+980 lines)**
- Added 8 new lucide-react icons (ClipboardList, CreditCard, Wallet, PhoneCall, UserCheck, DollarSign, Receipt, ArrowUpDown, CircleDot)
- Added "registrations" tab entry to TABS array (after "content")
- Added types: EnrollmentEntry, CourseOption
- Added config constants: PAYMENT_STATUS_CONFIG, REGISTRATION_METHOD_CONFIG, ENROLLMENT_STATUS_CONFIG
- Added formatToman helper
- Added CriticalActionWarningDialog (reusable) - requires typing "تایید" to confirm
- Added EnrollmentViewDialog - full details with payment history
- Added EnrollmentEditDialog - all fields editable + quick actions + warning system
- Added NewRegistrationDialog - admin enrollment creation
- Added RegistrationsTab - 7 summary cards, gateway alert, filters, sortable table
- Added tab rendering in main component

### Key Features
1. **Summary Dashboard**: 7 cards showing total/paid+revenue/unpaid+outstanding/partial/online/phone/in-person
2. **Pending Gateway Alert**: Banner for pending_gateway enrollments with quick filter
3. **Search & Filters**: Search by name/email/phone, filter by payment/method/course/status
4. **Sortable Table**: Sort by date or amount with direction toggle
5. **View Dialog**: Full enrollment details including payment history
6. **Edit Dialog**: All fields + Mark Paid/Mark Waived/Refund quick actions
7. **New Registration**: Admin enrollment creation (phone/in_person)
8. **Warning System**: Double-confirmation for delete, refund, and status-to-dropped changes

## Verification
- Zero lint errors
- Dev server compiling successfully
- All existing functionality preserved
