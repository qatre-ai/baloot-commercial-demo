---
Task ID: 2-a
Agent: full-stack-developer
Task: Create student API routes + seed data

Work Log:
- Created GET /api/student/dashboard — comprehensive dashboard endpoint returning profile, stats, enrollments, tickets, schedules, exercises, and recommendations
- Created GET /api/student/enrollments — list enrollments with optional ?status= filter
- Created POST /api/student/enrollments — enroll in a course with duplicate check
- Created GET /api/student/exercises — exercises for enrolled courses with submission status
- Created POST /api/student/exercises/[id]/submit — create or update exercise submission
- Created GET /api/student/schedule — upcoming class schedules with ?from=&to= date filter
- Created GET /api/student/recommendations — personalized recommendations based on instruments/categories
- Created seed script at prisma/seed-student-learning.ts with demo student, enrollments, tickets, exercises, submissions, and schedules
- Ran seed successfully — all data created
- ESLint passes with zero errors

Stage Summary:
- 7 API routes created under /api/student/
- Demo student account: student@mab.ir / 123456
- Seed data: 4 course enrollments, 3 workshop tickets, 6 exercises, 3 exercise submissions, 10 class schedules
- All routes require authentication (getSession)
- Recommendations use enrolled course instruments/categories to find similar content
- Exercise submit endpoint supports both create and update (resubmit)
