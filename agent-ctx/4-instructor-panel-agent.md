# Task 4 - Instructor Panel Agent

## Task
Rewrite instructor panel with real API connections (remove mock data, add Requests tab)

## Summary of Work

### Files Modified
1. **`/home/z/my-project/src/lib/auth/store.ts`** - Added `showInstructorPanel` and `setShowInstructorPanel` to auth store
2. **`/home/z/my-project/src/components/instructor/instructor-panel.tsx`** - Complete rewrite (~2148 lines → ~1100 lines)
3. **`/home/z/my-project/src/app/page.tsx`** - Added InstructorPanel component import and render
4. **`/home/z/my-project/src/components/layout/header.tsx`** - Added instructor panel button for instructor users

### Key Changes

#### Auth Store
- Added `showInstructorPanel: boolean` state
- Added `setShowInstructorPanel` action
- Reset `showInstructorPanel: false` on logout

#### Instructor Panel Rewrite
- **Removed** all 4 mock data generators (generateMockSchedule, generateMockClasses, generateMockExercises, generateMockAnnouncements)
- **Removed** old types that didn't match API responses
- **Added** new types matching real API: ScheduleItem (dayOfWeek, startTime, endTime, course, branch), ScheduleRequestItem, ExerciseItem (with submissionStats)

**5 Tabs:**
1. **Dashboard (داشبورد)** - Welcome with instructor name, today's count, pending grading, next class, quick actions, today's timeline
2. **Schedule (برنامه هفتگی)** - Preserved Jalali calendar with month/week view, adapted for dayOfWeek-based recurring + one-time schedules, class detail dialog on click
3. **Classes (کلاس‌ها)** - Grouped by courseId, shows schedules and exercises per course, add exercise button
4. **Requests (درخواست‌ها)** - NEW tab replacing Announcements, shows schedule change requests with create dialog
5. **Exercises (تمرین‌ها)** - Lists exercises with submission stats, create dialog

**API Endpoints Connected:**
- GET `/api/instructor/schedule` → schedules
- GET `/api/instructor/schedule-requests` → requests + stats
- GET `/api/instructor/exercises` → exercises
- POST `/api/instructor/schedule-requests` → create request
- POST `/api/instructor/exercises` → create exercise

#### Header Integration
- Added Music icon import
- Desktop: separate "پنل مدرس" button for instructors (sky-colored)
- Mobile: instructor panel option in hamburger menu
- Profile button routes to instructor panel for instructors

#### Auth Check
- Panel only renders when `showInstructorPanel && user.role === "instructor"`

### Lint Results
- Fixed React Compiler memoization error
- Added Music icon to header imports  
- Only pre-existing error remains (about.tsx useEffect)
- Dev server running with 200 response

### No Issues Found
All functionality implemented as specified. The panel is:
- RTL-first with Persian labels
- Simple with large touch targets for traditional instructors
- Full-screen overlay like admin panel
- Connected to real API endpoints with proper loading states
