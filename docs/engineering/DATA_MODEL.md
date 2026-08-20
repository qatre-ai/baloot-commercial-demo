# Data Model

The primary business entities are `Student`, `Admin`, `PendingRegistration`, `Course`, `CourseEnrollment`, `Workshop`, `WorkshopTicket`, `Payment`, `ClassSchedule`, and `AuditLog`.

Critical uniqueness constraints:

- `Student.email`
- `WorkshopTicket(studentId, workshopId)`
- `CourseEnrollment(studentId, courseId)`
- `AdminPermission(adminId, resource, action)`

Registration lifecycle:

```text
PendingRegistration: pending -> approved | rejected
CourseEnrollment: active -> completed | dropped | suspended | paused
WorkshopTicket: reserved -> paid | cancelled | attended
Payment: pending -> paid | failed | refunded | overdue
```

SQLite is the local development database. Production database selection remains a deployment decision and should be validated against expected concurrency and backup requirements.

