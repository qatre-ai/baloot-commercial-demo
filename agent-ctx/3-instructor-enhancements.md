# Task 3: Enhance Instructor Panel

## Agent: Subagent (full-stack-developer)

## Summary
Enhanced the instructor panel with 4 major features: Class Announcements, Makeup Class Management, Improved Exercise Creation, and Today's Summary Widget.

## Changes Made

### File Modified
- `/home/z/my-project/src/components/instructor/instructor-panel.tsx`

### Feature 1: Class Announcements (اعلان کلاس)
- Added `AnnouncementItem` interface and `ANNOUNCEMENT_TYPE_CONFIG` constant
- 4 announcement types: info (sky), reminder (amber), cancellation (red), homework (purple)
- Megaphone button in expanded class view opens announcement dialog
- Announcements appear as sky-blue dots on calendar days
- Full announcement details shown in day detail view with type-specific styling
- Mock data generator creates 3 sample announcements

### Feature 2: Makeup Class Management (کلاس جبرانی)
- Added `MakeupClassItem` interface
- Added "makeup" type to `CLASS_TYPE_COLORS` with teal color scheme
- "جلسه جبرانی" button in calendar header and Today's Summary Widget
- Makeup dialog: course selection, date, time, duration, location, notes
- Created makeup classes automatically added to schedule with "makeup" type
- CalendarPlus icon used for makeup classes in day detail view

### Feature 3: Improved Exercise Creation
- Course/class dropdown added at top of Create Exercise dialog
- Selected course shows info line (name, students, schedule)
- "تمرین جدید" button in expanded My Classes view
- Cross-tab exercise creation: clicking from Classes tab switches to Exercises tab with course pre-selected
- Auto-sets instructorId on exercise creation
- Fixed React lint error by using render-time state update instead of useEffect

### Feature 4: Today's Summary Widget
- Shows at top of Calendar tab
- 3 stat boxes: today's classes, pending submissions, makeup classes
- Next upcoming class card with time
- Quick action button for creating makeup class
- Gradient card design with teal accents

## Verification
- ESLint passes cleanly (0 errors, 0 warnings)
- Dev server running without errors
- All features bilingual (RTL Persian / LTR English)
