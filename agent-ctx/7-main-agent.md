# Task 7 - Student Dashboard UX Optimization

## Agent: Main Agent
## Task: Optimize Student Dashboard UX/UI for World-Class Experience

### Files Modified:
1. `/home/z/my-project/src/app/api/student/payments/route.ts` - NEW student-facing payments API
2. `/home/z/my-project/src/app/api/student/dashboard/route.ts` - Added payment summary & todayClassesCount
3. `/home/z/my-project/src/components/auth/student-dashboard.tsx` - Complete UX overhaul

### Key Changes:
- Quick Action Bar with 4 action cards (Submit Exercise, Today's Classes, Pay Installment, Message Instructor)
- Payment/Installment Status Widget with progress bar and next installment details
- Instructor Contact Dialog with profile, phone, and social links
- Enhanced instructor-student coordination in Courses and Exercises tabs
- Jalali Calendar improvements: today's classes above calendar, "Go to Today" button, makeup class badges
- Badge counts on tab labels for pending items
- Makeup class visibility with teal "جبرانی" badge
- Enhanced feedback display with color-coded borders based on grade

### API Notes:
- Student dashboard API now returns `paymentSummary` and `stats.todayClassesCount`
- New `/api/student/payments` endpoint for detailed payment data
- Both endpoints use session-based auth

### Lint: Passes cleanly
### Dev Server: Running without errors
