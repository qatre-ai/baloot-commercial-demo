# Task 2-d: Review and Comprehensively Fix/Enhance Student Dashboard

## Agent: Main Agent

## Summary
Comprehensive review and enhancement of the Student Dashboard component for مهرآوای بلوط music school website.

## Changes Made

### 1. Auth Store Fix (`src/lib/auth/store.ts`)
- Added `showDashboard: true` to `login()` state update — dashboard now auto-opens on student login
- Added `showDashboard: true` to `register()` state update — dashboard now auto-opens on student registration

### 2. Student Dashboard Complete Rewrite (`src/components/auth/student-dashboard.tsx`)

#### Panel Rendering & UX
- Dashboard auto-opens on login/registration
- RTL-aware panel positioning (slides from left in RTL, right in LTR)
- Close button with aria-label
- Enhanced profile section

#### Quick Stats
- 4 stat cards: Active Courses, Sessions, Pending Exercises, Alerts
- All numbers use `toPersianDigits()`

#### Classes Tab
- Course cards with progress bars, instructor, level, type, payment status
- Branch name display
- Click-to-view detail with Eye icon
- Class detail dialog with full info grid

#### Schedule Tab
- Weekly schedule grouped by day
- RTL-aware border styling
- Branch name and room info
- Time with `dir="ltr"` for correct rendering

#### Financial Tab
- Summary cards with `formatToman()` (Persian digits + تومان)
- Payment progress bar with Persian percentage
- Installment breakdown per enrollment

#### Exercises Tab (Enhanced)
- Grouped by course with expandable/collapsible sections
- Submit button for unsubmitted exercises
- Exercise submission dialog with textarea
- Instructor feedback display
- Due date highlighting (red if past due)
- Grade display with Trophy icon
- Connects to `/api/student/exercises/[id]/submit`

#### New Tab: Recommendations
- Personalized course/workshop recommendations
- Shows instrument, level, price, branch, featured badge
- Register CTA

#### New Tab: Announcements
- Fetches from `/api/announcements`
- Type badges (urgent/important/info/event)
- Detail dialog with image support
- Pinned announcement highlighting

#### Bug Fixes
- All DialogTitle warnings fixed with sr-only pattern (4 dialogs)
- Number formatting: `toPersianDigits()` from `@/lib/jalali` throughout
- Added `formatToman()` helper for consistent formatting
- Toast notifications for errors (useToast hook)
- RTL support fixes (flex-row-reverse, text-right, dir attributes)
- Proper TypeScript types for new interfaces

#### Professional UI
- Loading skeletons for all tabs
- Empty states with icons and messages
- Error handling with toast notifications
- Responsive design (mobile-first)
- Staggered animations
- Notification badges on tabs
- Scrollable tab bar

## Files Modified
1. `src/lib/auth/store.ts` — Added showDashboard: true to login/register
2. `src/components/auth/student-dashboard.tsx` — Complete rewrite with all enhancements

## Verification
- `bun run lint` passes cleanly with no errors
- Dev server compiles successfully
