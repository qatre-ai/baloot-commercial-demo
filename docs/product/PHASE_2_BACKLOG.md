# Phase 2 Product Backlog

## Student application

### Core capabilities in this phase

- Classes: view active/completed/paused enrollments and register for published classes.
- Schedule: view active recurring and one-time sessions.
- Exercises: view assigned work and submit it with feedback.
- Payments: show course and workshop payment state without implying an online gateway.
- Workshops: discover published workshops, see availability, and reserve a seat through the existing purchase flow.
- Profile: view and edit the existing student profile fields with validation and persistence.
- Announcements: read published announcements and open details.
- Account controls: logout and safe navigation from the authenticated application shell.

### Deferred items

- A separate notification center with read/unread persistence.
- Online payment gateway integration and receipt upload.
- Student chat, social features, gamification, or community features.
- A large settings center beyond existing account controls.
- Calendar export, reminders, and push notifications.

## Instructor application

The instructor application will be audited after the Student journey is stabilized. New instructor capabilities are not introduced unless an existing core workflow is found to be incomplete or non-functional.

## Control rule

Deferred items must not be represented by visible dead buttons or misleading status labels. They can be added only with a defined API/data contract and an end-to-end test path.
