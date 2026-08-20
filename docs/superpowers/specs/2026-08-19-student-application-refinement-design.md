# Student Application Refinement Design

## Goal

Make the existing Student application reliable and easy to operate without replacing
the established Mehr Avaye Baloot visual language. The work focuses on the real
student journey: authenticated access, classes, schedule, exercises, workshops,
payments, announcements, profile, and account controls.

## Design decisions

1. Keep the existing warm cream, burgundy, gold, RTL, and Vazirmatn token system.
2. Keep the current dashboard tabs as the primary interaction model, while adding
   only core destinations that already have a compatible data model.
3. Keep workshop reservations on the existing `/api/workshops/[id]/purchase`
   business flow; do not duplicate seat or payment rules in the UI.
4. Add a student-owned profile endpoint backed by the existing `Student` model.
   No schema migration is required.
5. Treat payment records as stateful operational data. The UI distinguishes paid,
   pending, overdue, failed, refunded, partial, and waived states and does not
   promise online payment when no gateway exists.
6. In route-owned mode, close controls must not hide the whole application. The
   application shell owns logout and navigation; the dashboard owns only dialogs.

## Component and flow boundaries

- `StudentDashboard` remains the composition boundary for the student journey.
- Small typed helpers will normalize API errors, profile validation, and workshop
  state labels so behavior can be tested independently from rendering.
- Profile saves use optimistic-safe behavior: validate locally, submit once,
  preserve the last saved values on failure, and show an actionable error.
- Registration and workshop reservation use loading guards, server error mapping,
  and refresh the affected data after success.
- Empty, loading, error, and success states remain explicit for every core tab.

## Accessibility and responsive behavior

- Every interactive card is replaced by a semantic button where it performs an
  action, with keyboard focus and an accessible name.
- Dialogs retain title/description semantics and focus management.
- Tabs remain horizontally scrollable on narrow screens and preserve readable
  labels on desktop.
- Motion is decorative only and respects reduced-motion preferences.

## Validation

- Contract tests cover profile validation, workshop availability labels, and
  registration error mapping.
- QA seed data is used for real browser checks at desktop, tablet, and mobile
  widths.
- Network and console output are reviewed for Student requests; unrelated admin
  errors are recorded separately and not silently attributed to Student.
