# گزارش نهایی پذیرش تجاری — مهر آوای بلوط

**تاریخ:** ۲۰ آگوست ۲۰۲۶  
**محیط آزمون:** Windows / QA runtime روی `http://localhost:3010`  
**تصمیم:** `NOT PRODUCTION READY` — هستهٔ عملیاتی پایدار است، اما release تجاری تا بسته‌شدن blockerهای زیر صادر نمی‌شود.

## خلاصهٔ اجرایی

- ثبت‌نام کلاس و کارگاه، کنترل ظرفیت، جلوگیری از ثبت‌نام تکراری، صف بررسی منشی، پرداخت و audit در محیط QA قابل اجرا و قابل مدیریت هستند.
- داشبورد Admin و Super Admin، RBAC، مانیتورینگ، وضعیت‌های پرداخت، صف ثبت‌نام و جریان‌های instructor در دادهٔ پایدار QA بررسی شده‌اند.
- مشکل duplicate key در پنل instructor از `AnimatePresence` بیرونی و فرزندان بدون key ریشه‌یابی و اصلاح شد.
- تمام خطاهای lint سورس پروژه پس از حذف rehearsal موقت برطرف شده‌اند؛ `npm run lint` و `npm run typecheck` هر دو PASS هستند.
- build مستقل روی clean install ویندوزی PASS شد؛ در rehearsal اولیه، نبودن `tsconfig.json` و عدم اجرای `prisma generate` اصلاح و build نهایی با خروجی standalone موفق شد.

## ماتریس پذیرش

| حوزه | نتیجه | شواهد |
|---|---|---|
| Build production | PASS | clean install، `prisma generate`، `npm run build`، standalone bundle |
| Type safety | PASS | `npm run typecheck` |
| Lint | PASS | `npm run lint` با exit code صفر و بدون warning lint |
| ثبت‌نام کلاس | PASS | `npm run test:wizard`، QA dataset و flow API |
| ثبت‌نام کارگاه | PASS | ظرفیت، تکراری و بسته بودن در QA dataset |
| صف منشی | PASS | pending/approved/rejected و audit در `db/qa.db` |
| پرداخت | PASS | وضعیت‌های paid/partial/pending/failed/refunded و fallback شهریه |
| RBAC | PASS | `npm run test:rbac`: ۵۳ permission مصرف‌شده، نقش secretary و denyهای privileged |
| Instructor | PASS | `npm run test:instructor-presence` و contractهای collection/profile/payment |
| Admin/Super Admin | PASS | browser evidence قبلی، QA dataset، API/RBAC smoke و dashboard metrics |
| AI editorial copilot | CONDITIONAL | schema، rate limit، request id، draft-only و failure handling PASS؛ live provider key تست نشد |
| Accessibility automated | NOT TESTED / BLOCKER | axe/Lighthouse executable در محیط موجود نبود؛ keyboard/manual review کامل باید تکمیل شود |
| Performance baseline | PASS BASELINE | دادهٔ عددی پایین‌تر؛ load production-scale و Core Web Vitals هنوز اجرا نشده |
| Clean deployment | PASS | install مستقل، DB creation، generate، build و standalone route generation |
| Migration history | BLOCKER | `prisma/migrations` در repository وجود ندارد؛ rehearsal با `prisma db push` انجام شد |
| Dependency security | BLOCKER | `npm audit --omit=dev`: ۵ high و ۴ moderate |
| Backup before work | PASS | `Baloot_PRE_COMMERCIAL_ACCEPTANCE_2026-08-19_17-42-05.zip` |
| Backup after work | PENDING | پس از تثبیت این گزارش ساخته می‌شود |

## شواهد regression

این فرمان‌ها در workspace اصلی PASS شدند:

```text
npm run typecheck
npm run lint
npm run test:blog-ai
npm run test:instructor-presence
npm run test:rbac
npm run test:wizard
npm run qa:verify
```

خروجی dataset پایدار:

- Adminها: `qa.admin@mab.local`، `qa.secretary@mab.local`، `qa.superadmin@mab.local`
- Student/Instructorهای QA و شش course fixture
- چهار workshop fixture با حالت open/closed/full/almost-full
- چهار registration fixture: دو pending، یک approved و یک rejected
- پنج payment fixture: paid، partial، pending، failed و refunded
- شش schedule و شش enrollment
- چهار workshop ticket و یک announcement
- audit seed count: `1`

جزئیات حساب‌های QA و رمزها در `docs/testing/TEST_ACCOUNTS.md` نگهداری می‌شود و نباید در production استفاده شود.

## performance baseline

نمونهٔ پنج درخواست متوالی به runtime QA، با پاسخ HTTP 200:

| مسیر | میانگین ms | کمینه | بیشینه |
|---|---:|---:|---:|
| `/` | 248.5 | 223.4 | 272.9 |
| `/api/courses` | 32.3 | 24.1 | 63.6 |
| `/api/workshops` | 29.3 | 23.6 | 37.2 |
| `/api/blog?pageSize=9` | 63.9 | 43.9 | 107.5 |
| `/student` | 132.2 | 59.5 | 369.5 |
| `/instructor` | 100.7 | 63.1 | 228.1 |
| `/admin` | 211.0 | 56.0 | 776.1 |
| `/super-admin` | 219.3 | 57.3 | 835.2 |

اندازهٔ خروجی:

- `.next/standalone`: حدود `193.75 MB`
- `.next/static`: حدود `3.04 MB`
- `public`: حدود `5.15 MB`

این اعداد baseline هستند، نه SLA نهایی. قبل از production باید تست concurrent، p95/p99، Core Web Vitals و soak test اجرا شود.

## clean-machine rehearsal

در `D:\work\project\Baloot\.tmp-clean-deploy-2026-08-20`:

1. `npm ci --ignore-scripts` با lockfile موفق شد.
2. `.env` ایزوله ساخته شد و DB مستقل `clean-deploy.db` ایجاد شد.
3. `prisma db push --skip-generate` schema را sync کرد.
4. `prisma generate` موفق شد.
5. `npm run build` با Next.js `16.3.1` و standalone postbuild موفق شد.
6. route generation شامل public، student، instructor، admin، super-admin و API routes کامل شد.
7. پوشهٔ rehearsal پس از ثبت شواهد حذف شد و به QA database دست‌کاری نشد.

## blockerهای release

### 1. Migration production

در حال حاضر schema با `prisma db push` قابل ایجاد است، اما migration history versioned در `prisma/migrations` وجود ندارد. قبل از release باید:

- initial migration با `prisma migrate diff --from-empty` تولید و review شود؛
- `npm run db:migrate:deploy` به عنوان فرمان production اضافه شود؛
- deploy روی DB خالی و DB دارای دادهٔ واقعی rehearsal شود؛
- backup، migration و rollback procedure مستند شوند.

### 2. Dependency security

`npm audit --omit=dev` خروجی زیر را گزارش کرد:

- `5 high`
- `4 moderate`
- `0 critical`

موارد مهم شامل Prisma/config، `sharp/libvips`، `js-yaml`، `deepmerge-ts` و Prism-related packages هستند. بدون triage، upgrade یا exception مکتوب امنیتی، production release تأیید نمی‌شود.

### 3. AI provider و accessibility

- `BLOG_AI_API_KEY` در محیط local configure نشده؛ live provider call عمداً انجام نشد.
- failure path و unauthenticated `401` تست شده، اما call موفق provider، timeout، malformed provider response و audit آن در محیط واقعی provider هنوز باید اجرا شود.
- automated axe/Lighthouse به دلیل نبودن browser automation runner در محیط موجود اجرا نشد؛ باید در CI یا ماشین QA با browser runner رسمی اجرا و artifact نگهداری شود.

## backupها

### قبل از acceptance

- فایل: `D:\work\project\_Baloot_Backups\Baloot_PRE_COMMERCIAL_ACCEPTANCE_2026-08-19_17-42-05.zip`
- SHA-256: `28CA5883BE68B175D823C6E4235D3C499AD9E1EE0F15C970B49C7BE4D3ADFFF2`

### backup قبلی پایدارسازی

- فایل: `D:\work\project\_Baloot_Backups\Baloot_POST_FINAL_STABILIZATION_2026-08-19_16-51-59.zip`
- SHA-256: `CE3207B00E469A7D8711FB6C8BD8FF09490261C81DFFC14A2D41B117F410353E`

## دستور اجرای local روی Windows

```powershell
cd D:\work\project\Baloot
npm ci
Copy-Item .env.example .env
npm exec prisma generate
npm exec prisma db push
npm run dev -- -p 3010
```

سپس مرورگر را روی `http://localhost:3010` باز کنید. برای QA پایدار، مقدار `DATABASE_URL` باید به `file:../db/qa.db` اشاره کند و از حساب‌های `docs/testing/TEST_ACCOUNTS.md` استفاده شود.

## تصمیم نهایی

**تأیید عملیاتی QA: PASS.**  
**تأیید production تجاری: BLOCKED.**

تا زمان وجود migration versioned، triage آسیب‌پذیری‌های production، اجرای automated accessibility و live AI provider acceptance، ادعای «production ready» مجاز نیست.
