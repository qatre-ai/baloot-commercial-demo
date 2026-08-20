# Payment Flows

Payments are represented by `Payment` and linked to a course enrollment or workshop ticket where applicable. Admin payment changes are protected by RBAC and should be audited.

The current platform supports manual payment recording and gateway route placeholders. A payment record must not be considered paid solely because client input says so; the server must validate the authenticated actor and payment state transition.

