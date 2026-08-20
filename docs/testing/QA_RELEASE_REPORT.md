# Final Pre-Production QA Report

**پروژه:** مهر آوای بلوط  
**محیط:** QA ایزوله با SQLite در `db/qa.db`  
**آدرس محلی:** `http://localhost:3010`  
**تاریخ گزارش:** ۱۸ اوت ۲۰۲۶  
**وضعیت کلی:** هسته ثبت‌نام و گردش‌کار مدیریت اصلاح و با مرورگر واقعی اثبات شده است؛ گیت انتشار Production هنوز کامل تأیید نشده است.

## خلاصه اجرایی

باگ اصلی ثبت‌نام در مرحله نهایی رفع شد. ثبت فرم از مرورگر واقعی تا پاسخ `201`، ایجاد رکورد pending در دیتابیس، نمایش در پنل منشی، تأیید، ساخت کاربر فعال و ثبت audit log بررسی شد. دسترسی سوپرادمین و اجرای Proxy روی پورت QA نیز بررسی شد.

با این حال، این گزارش عمداً ادعای «آماده انتشار Production» نمی‌کند، چون تست خودکار مرورگر، ماتریس کامل responsive، ممیزی Console/Network و تصاویر داشبورد استاد/ادمین هنوز شواهد اجرایی ثبت‌شده ندارند. این موارد باید قبل از تأیید نهایی انتشار تکمیل شوند.

## Issue

1. فرم ثبت‌نام دانشجوی بزرگسال در مرحله ۶ متوقف می‌شد و به‌جای ارسال، دکمه «بعدی» نمایش می‌داد.
2. نوار کناری پنل ادمین/منشی به‌دلیل محدودیت flex/scroll فقط داشبورد را نشان می‌داد و دسترسی به ثبت‌نام‌های آنلاین دشوار یا غیرممکن بود.
3. Auto-backup در محیط QA روی پورت `3010` به آدرس hard-coded پورت `3000` متکی بود و با قرارداد Proxy در Next.js 16 نیز ناسازگاری داشت.

## Root Cause

- منطق نمایش دکمه ارسال از مقایسه `currentStep === totalSteps` استفاده می‌کرد، درحالی‌که شماره مراحل با توجه به نقش و فیلدهای خردسال می‌تواند پرش داشته باشد؛ برای دانشجوی بزرگسال مراحل قابل مشاهده `[1,2,3,4,6]` هستند.
- `ScrollArea` داخل کانتینر flex ارتفاع قابل کوچک‌شدن نداشت و بدون `min-h-0` محتوای منو را پنهان می‌کرد.
- فایل `src/middleware.ts` با Next.js 16 deprecated بود و Auto-backup از origin ثابت استفاده می‌کرد.

## Fix

- تابع canonical به نام `isWizardFinalStep` اضافه و در فرم ثبت‌نام استفاده شد؛ منطق محاسبه مرحله بعد و نمایش دکمه ارسال اکنون یک منبع حقیقت دارند.
- نوار کناری ادمین به `min-h-0 flex-1` تغییر کرد تا تمام آیتم‌ها در viewport قابل دسترسی باشند.
- `src/middleware.ts` به `src/proxy.ts` منتقل شد؛ origin درخواست برای Auto-backup استفاده می‌شود و در صورت نیاز `BACKUP_INTERNAL_ORIGIN` امکان override دارد.
- محیط QA، حساب‌های پایدار، داده‌های seed idempotent و اسکریپت inspection اضافه شده‌اند.

## Browser Test

### ثبت‌نام عمومی

- فرم در Chrome واقعی روی `http://localhost:3010` باز شد.
- داده معتبر برای یک دانشجوی بزرگسال وارد شد.
- مرحله نهایی پس از اصلاح دکمه «ثبت‌نام» را نمایش داد.
- ارسال انجام شد و پیام موفقیت «ثبت‌نام شما دریافت شد!» در UI دیده شد.
- تصویر: `docs/evidence/registration-final.png`

### مدیریت ثبت‌نام

- منشی با `qa.secretary@mab.local` وارد پنل شد.
- منوی «ثبت‌نام‌های آنلاین» از نوار کناری باز شد.
- رکورد pending ایجادشده توسط مرورگر در فهرست و جزئیات دیده شد.
- تأیید از UI انجام شد.
- رکورد تأییدشده در فهرست مدیریت دیده شد.
- تصاویر: `docs/evidence/admin-pending-registration.png` و `docs/evidence/admin-approved-registration.png`

### سوپرادمین

- ورود `qa.superadmin@mab.local` انجام شد.
- داشبورد و منوی سطح بالا با آیتم‌های امنیت، پشتیبان‌گیری، تحلیل و فعالیت دیده شد.
- تصویر: `docs/evidence/super-admin-dashboard.png`

### داشبورد دانشجو

- ورود واقعی با حساب `qa.student@mab.local` در Chrome انجام شد.
- پنل دانشجو، آمار جلسات/تمرین و کلاس‌های QA قابل مشاهده بود.
- تصویر: `docs/evidence/student-dashboard.png`

## API Test

شواهد ثبت‌شده در لاگ سرور:

- `POST /api/registration/pending` با پاسخ `201`
- `PATCH /api/registration/pending/{id}` با پاسخ `200`
- `POST /api/admin/audit-logs` با پاسخ `201`
- درخواست ناشناس `GET /api/admin/auth/me` با پاسخ `401`
- صفحه اصلی QA با پاسخ `200`

تست API مستقل کامل برای تمام routeها در این دور اجرا نشده است؛ بنابراین این بخش فقط سناریوهای مشاهده‌شده را پوشش می‌دهد.

## DB Verification

پس از ارسال مرورگر، رکورد ثبت‌نام با وضعیت `pending`، ایمیل، تلفن، کد ملی، ساز و user-agent در SQLite ثبت شد.

پس از تأیید:

- وضعیت ثبت‌نام `approved` شد.
- `reviewedBy` برابر شناسه منشی شد.
- کاربر دانشجو ساخته و فعال شد.
- رکورد `createdUserId` به کاربر ساخته‌شده اشاره کرد.
- audit log با عملیات `APPROVE_REGISTRATION` ثبت شد.

برای داده‌های پایدار QA نیز موارد زیر وجود دارد: حساب‌های نقش‌محور، چهار دوره، سه کارگاه، وضعیت‌های pending/approved/rejected، پرداخت‌های paid/pending/failed/refunded، برنامه‌ها، enrollmentها و ticketها.

## Admin Verification

- منشی دسترسی لازم برای مدیریت ثبت‌نام‌های ورودی را دارد.
- تأیید ثبت‌نام از UI تا دیتابیس و audit log بررسی شد.
- داده rejected با علت رد و reviewer در fixture QA وجود دارد.
- سوپرادمین به منوهای privileged دسترسی دارد.
- تست RBAC کاتالوگ permissionها و denyهای سطح privileged را PASS کرده است.

## Regression Test

| گیت | وضعیت | توضیح |
| --- | --- | --- |
| تست unit منطق wizard | PASS | `npm run test:wizard` |
| تست RBAC | PASS | `npm run test:rbac` |
| TypeScript | PASS | `npm run typecheck` |
| Build | PASS | `npm run build`؛ خروجی standalone ساخته شد |
| ثبت‌نام واقعی مرورگر | PASS | UI + API `201` + DB + admin |
| تأیید/ساخت کاربر | PASS | UI + API `200` + DB + audit |
| Proxy/QA smoke | PASS | `/` برابر `200` و `/api/admin/auth/me` برابر `401` ناشناس |
| Playwright/Cypress E2E | NOT EVIDENCED | dependency در پروژه نصب نیست |
| Console/Network audit | NOT EVIDENCED | گزارش مستقل ذخیره نشده است |
| ماتریس responsive | NOT EVIDENCED | تمام viewportهای خواسته‌شده اجرا نشده‌اند |
| داشبورد دانشجو | PASS | ورود و نمایش پنل در Chrome واقعی؛ `docs/evidence/student-dashboard.png` |
| داشبورد استاد | NOT EVIDENCED | تصویر و اجرای دستی نهایی ثبت نشده |
| داشبورد ادمین ساده | NOT EVIDENCED | تصویر مستقل ثبت نشده؛ پنل منشی در سناریوی ثبت‌نام مشاهده شده است |
| Full lint | NOT PASS | خطاهای موجود محصول، از جمله `react-hooks/set-state-in-effect` در پنل ادمین |

Build با ۲۵ هشدار tracing مربوط به دسترسی‌های filesystem در ماژول backup کامل شد؛ این هشدارها مانع compile یا تولید standalone bundle نشدند، اما برای سخت‌سازی deployment باید در یک کار مستقل بررسی شوند.

## Evidence

فهرست کامل تصاویر و منشأ آن‌ها در `docs/evidence/README.md` قرار دارد. فایل‌های مفقود عمداً ساخته نشده‌اند تا شواهد QA قابل اعتماد باقی بماند.

## Release Decision

**تصمیم:** `CONDITIONAL / NOT PRODUCTION-READY YET`

هسته اصلاح‌شده ثبت‌نام برای QA قابل قبول است، اما تأیید انتشار نهایی منوط به اجرای گیت‌های `NOT EVIDENCED`، اجرای موفق build نهایی و تصمیم‌گیری درباره خطاهای lint موجود است. تا آن زمان، ادعای سلامت کامل Production قابل صدور نیست.

## Local Runbook

```powershell
npm run qa:seed
npm run qa:inspect
npm run qa:dev
```

سپس مرورگر را روی `http://localhost:3010` باز کنید. حساب‌ها و رمز تست در `docs/testing/TEST_ACCOUNTS.md` ثبت شده‌اند.
