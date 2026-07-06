# Task 5: Registration Form Update - Work Record

## Task
Add registration method, tuition & payment section to the registration form component.

## Changes Made

### File: `src/components/auth/registration-form.tsx`

#### 1. New Imports
Added 9 new lucide-react icons: CreditCard, DollarSign, Calendar, Receipt, Monitor, PhoneCall, UserCheck, AlertCircle, Wallet

#### 2. FormData Interface
Added 5 new fields:
- `registrationMethod: "online" | "phone" | "in_person"` (Step 1 admin mode)
- `tuitionAmount: string` (Step 3/4 admin payment)
- `paymentStatus: string` (Step 3/4 admin payment)
- `paymentDueDate: string` (Step 3/4 admin payment)
- `paymentRef: string` (Step 3/4 admin payment)

#### 3. New Constants
- `REGISTRATION_METHODS`: 3 options (online/phone/in_person) with icons, Farsi/English labels and descriptions
- `PAYMENT_STATUSES`: 4 options (paid/unpaid/partial/waived) with color-coded display

#### 4. ADMIN_GUIDE Updates
Added 5 new entries: registrationMethod, tuitionAmount, paymentStatus, paymentDueDate, paymentRef

#### 5. Form State
Initialized with: `registrationMethod: "online"`, `tuitionAmount: ""`, `paymentStatus: "unpaid"`, `paymentDueDate: ""`, `paymentRef: ""`

#### 6. Step 1 - Admin Mode Banner
- Amber-bordered card with Shield icon and "حالت ادمین - ثبت‌نام از طرف هنرجو" banner
- 3-column grid of registration method cards with icons (Monitor/PhoneCall/UserCheck)
- Description text below selected method
- Validation error support

#### 7. Step 3 - Tuition & Payment Section
- **Admin mode**: Emerald-bordered card with Wallet icon + "شهریه و پرداخت" header + Admin badge
  - Tuition Amount (DollarSign icon, number input, Toman formatting with locale display)
  - Payment Status (4-card grid: paid/unpaid/partial/waived with color coding)
  - Auto paidAt notice when "paid" is selected
  - Payment Due Date (Calendar icon, date input)
  - Payment Reference (Receipt icon, text input)
- **Non-admin mode**: Amber payment gateway notice "پس از تکمیل فرم، به درگاه پرداخت هدایت می‌شوید"

#### 8. Step 6 - Summary Updates
- Registration method shown in summary (admin mode)
- Payment summary sub-section with Wallet icon (admin only, shown when tuition or non-default status exists)
- Payment gateway notice for non-admin users

#### 9. Success Screen
- Added CreditCard payment gateway redirect message for non-admin users

#### 10. handleSubmit Updates
- `registrationMethod`: auto "online" for non-admin, admin-selected for admin mode
- Admin-only: tuitionAmount (parsed to int), paymentStatus, paymentDueDate, paymentRef
- Auto `paidAt` timestamp when admin marks as "paid"
- Non-admin: `paymentStatus: "pending_gateway"`

#### 11. Validation
- Added `isAdminMode` to validateStep dependencies
- Admin mode Step 1: registrationMethod is required

## Lint & Build
- Zero lint errors
- Dev server running clean
