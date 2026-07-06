Task ID: 5
Agent: API Routes Agent
Task: Create API route files and seed script

Work Log:
- Created `/src/app/api/announcements/route.ts` with GET (published only, filtered by expiry, ordered by isPinned DESC, priority DESC, createdAt DESC) and POST
- Created `/src/app/api/announcements/[id]/route.ts` with GET single, PUT update (partial), DELETE
- Created `/src/app/api/contact/route.ts` with POST (name, email, phone?, subject, message + email validation)
- Created `/prisma/seed.ts` with sample data:
  - 2 branches (Vanak, West) with FA/EN addresses and coordinates
  - 6 instructors (Piano, Guitar, Violin, Vocals, Drums, Theory) with FA/EN bios
  - 6 courses (Piano, Guitar, Violin, Vocals, Drums, Theory) across branches
  - 3 workshops (Piano Improvisation, Iranian Vocal, Rhythm & Percussion) with future dates
  - 5 announcements (info, workshop, event, urgent, promo) with FA/EN content
- Ran seed successfully - all records inserted
- ESLint passes with zero errors
- Uses Next.js 16 route handler patterns (export async function GET/POST/PUT/DELETE)
- Uses `import { db } from '@/lib/db'` for Prisma client

Stage Summary:
- 3 API route files created with full CRUD operations
- 1 seed script with comprehensive bilingual sample data
- All routes properly typed with TypeScript
- Error handling with appropriate HTTP status codes
- Announcement GET filters: isPublished=true, expiresAt null or future
- Announcement ordering: isPinned DESC → priority DESC → createdAt DESC
- Contact POST validates required fields and email format
