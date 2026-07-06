# Task 2-c: Review and Comprehensively Fix/Enhance Instructor Panel

## Agent: Instructor Panel Fix & Enhancement Agent

## Summary
Comprehensive rewrite of the instructor panel (`/home/z/my-project/src/components/instructor/instructor-panel.tsx`) to fix bugs, add missing features, and polish the UI.

## Changes Made

### New Tabs Added (3)
1. **Submissions Tab** (تصحیح) - View/grade student submissions with status filters
2. **Announcements Tab** (اطلاعیه‌ها) - View admin announcements with type/pin indicators
3. **Makeup Class Tab** (جبرانی) - Request makeup classes via /api/instructor/makeup-class

### Bug Fixes
- Fixed grading API call (was using wrong endpoint, now uses /api/instructor/submissions PATCH)
- Fixed week view showing only 6 days (now shows full 7-day Persian week)
- Fixed DialogTitle accessibility warnings (all Dialogs now use sr-only DialogTitle)
- Fixed date formatting (now uses shared formatJalaaliDate utility)
- Fixed number formatting (now uses shared toPersianDigits from @/lib/jalali)

### API Connections
- Connected to /api/instructor/dashboard for richer dashboard data
- Connected to /api/instructor/submissions for submission listing and grading
- Connected to /api/instructor/announcements for announcement display

### UI Improvements
- Skeleton loading instead of bare spinner
- Toast notifications (sonner) for all actions
- ScrollArea for tab navigation on mobile
- Tab badges for pending submissions and requests
- Enhanced grading dialog with student/exercise context
- Cancellation warning banner in request dialog

### Total Tabs: 8
Dashboard, Schedule, Classes, Exercises, Submissions, Requests, Makeup, Announcements

## Files Modified
- `/home/z/my-project/src/components/instructor/instructor-panel.tsx` (complete rewrite)
- `/home/z/my-project/worklog.md` (appended work log)

## Verification
- Lint passes cleanly
- Dev server compiles successfully
