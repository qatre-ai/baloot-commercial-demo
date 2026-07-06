---
Task ID: 3
Agent: Admin Dashboard Enhancement Agent
Task: Enhance the Admin Panel with Dashboard, Financial tab, improved Guide, and coordination fixes

Work Log:

### 1. Dashboard Tab (NEW - added as first tab)
- Added `DashboardData` and `DashboardMetrics` interfaces for type safety
- Added `dashboardData` and `isDashboardLoading` state variables
- Created `fetchDashboard` function using `authFetch("/api/admin/dashboard")`
- Added dashboard to `fetchAll` function and auto-refresh every 60 seconds
- Changed default `activeTab` from `"announcements"` to `"dashboard"`
- Dashboard includes:
  - **Welcome Banner** with admin name and Jalali date (using `getCurrentJalaali()` and `JALALI_MONTHS_FA/EN`)
  - **Priority Alerts** section for unpaid enrollments, unread messages, pending testimonials (with clickable navigation to relevant tabs)
  - **4 Quick Stats Cards**: Today's registrations, Upcoming workshops, Unread messages, Active announcements
  - **Recent Activity** timeline showing last 5 registrations/enrollments/workshops
  - **Quick Actions** grid with 6 buttons navigating to other tabs
  - **Summary stats** section showing total students, courses, enrollments, revenue
- All numbers formatted with `toPersianDigits` for RTL mode
- Uses same visual pattern as super admin DashboardTab but simplified

### 2. Financial Tab (NEW)
- Added `financialPayFilter` and `financialSearch` state variables
- Financial tab includes:
  - **4 Payment Summary Cards**: Paid (count + total amount), Unpaid (count + amount), Partial (count + amount), Total Revenue
  - **Filter bar** with search input and payment status dropdown (All/Paid/Unpaid/Partial/Waived)
  - **Results count badge** showing filtered count
  - **Enrollment list** with payment status badges, tuition amounts in تومان with Persian digits
  - **Jalali dates** using `formatJalaaliDate` for enrollment and paid dates
  - **Edit button** on each enrollment that opens the EnrollmentEditDialog
  - **Empty state** with wallet icon when no results
- Added EnrollmentEditDialog rendering inside the financial tab

### 3. Guide Tab Enhancement
- Replaced simple field list with comprehensive guide:
  - **Quick Reference** section with clickable navigation to 6 main tabs
  - **Step-by-Step Instructions** for 4 common operations:
    1. Create a New Workshop (6 steps)
    2. Manage a Course (6 steps)
    3. Payment Follow-up (6 steps)
    4. Schedule a Class (6 steps)
  - **FAQ Section** with 5 common questions and answers:
    - Changing payment status
    - Difference between primary/registration instrument
    - Marking workshops as Hot
    - Handling unpaid students
    - Approving schedule change requests
  - **Field Reference** - condensed version of the original adminGuideSections data
- All step numbers use `toPersianDigits` for RTL

### 4. Coordination with Super Admin
- Replaced ALL `fetch()` calls with `authFetch()` throughout the admin panel (20+ occurrences)
  - This includes: announcements, students, workshops, blog posts, blog categories
  - All write operations (POST, PUT, DELETE) now use authFetch
  - Ensures session token is always sent with admin API requests
- Both panels now use the same `/api/admin/dashboard` endpoint
- Added **role indicator** in sidebar header showing admin name and role badge (Admin/Super Admin)
- Sidebar header now shows user name and role badge

### 5. Bug Fixes
- All DialogTitle components already have proper titles (verified)
- All dates display in Jalali format using `formatJalaaliDate` from `@/lib/jalali`
- RTL support throughout using `isRTL` conditional and `cn()` with `flex-row-reverse`
- All number displays use `toPersianDigits` from `@/lib/jalali`
- Added `JALALI_MONTHS_EN` import for LTR date display
- Removed unused imports (TrendingUp, ArrowUpRight, ArrowDownRight, CircleDollarSign)
- Lint passes with zero errors

### 6. Sidebar Navigation Updates
- Added "Overview" group with Dashboard button (LayoutDashboard icon)
- Added Financial button in "Registration & Financial" group (Wallet icon)
- Updated `getTabLabel` to include `dashboard` and `financial` tabs
- Both new tabs have bilingual labels (Persian/English)
