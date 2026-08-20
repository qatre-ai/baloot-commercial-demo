# Registration Flows

## Public account registration

`POST /api/registration/pending` is a student-only public endpoint. It normalizes Persian/Arabic digits, accepts Iranian mobile formats, validates the national-ID checksum, rejects instructor roles and duplicate phone/national ID records, and creates the pending request plus admin notifications inside a transaction.

The public UI intentionally does not expose an instructor account type. Instructor creation is available only through authorized admin workflows and is also enforced server-side.

The music profile uses one canonical invariant: the registration instrument is the instrument associated with the requested class, the main instrument is optional, and an empty main instrument resolves to the registration instrument. Other instruments are normalized, deduplicated, and cannot contain the registration instrument.

The wizard transition model is centralized in `src/lib/registration/wizard.ts`. Adult students follow `1 -> 2 -> 3 -> 4 -> 6`, while minors and instructor onboarding follow all six visible steps. Progress is calculated from the visible step list and clamped to 100%.

## Review

`GET /api/registration/pending` and `PATCH /api/registration/pending/[id]` are admin-protected. Approval creates the student account and updates the pending request atomically. Rejection records the reason and reviewer.

The approval probe creates an isolated test pending request, verifies the resulting student row and status transition, then removes only the exact test records.

The approval probe also verifies that the instrument invariant survives the pending-registration-to-student transaction.

## Course enrollment

Authenticated students use `POST /api/student/class-register`. The endpoint checks publication, registration window, duplicates, capacity, and creates the enrollment plus notifications transactionally.

## Workshop reservation

Authenticated students use `POST /api/workshops/[id]/purchase`. The client must use `authFetch` so the session header is available in embedded/local browser contexts. Seat reservation and counter increment occur in one transaction.
