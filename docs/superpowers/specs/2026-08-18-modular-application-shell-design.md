# Modular Application Shell Architecture

## Goal

جدا کردن تجربه عمومی سایت از تجربه authenticated، با حفظ منطق کسب‌وکار موجود و ایجاد یک Shell مشترک برای دانشجو، استاد، منشی/ادمین و سوپرادمین.

## Current Architecture

- `src/app/page.tsx` هم‌زمان سایت عمومی و همه پنل‌های private را render می‌کند.
- `useAuthStore` با flagهای `showDashboard`, `showInstructorPanel` و `showAdminPanel` نمایش پنل‌ها را کنترل می‌کند.
- پنل‌های دانشجو و استاد به‌صورت overlay روی صفحه عمومی mount می‌شوند.
- پنل سوپرادمین در بعضی نقش‌ها full-screen است، اما route مستقل ندارد.
- احراز هویت از APIهای موجود و session token فعلی استفاده می‌کند.

## Target Architecture

صفحه عمومی در `/` بدون تغییر visual باقی می‌ماند. routeهای `/student`, `/instructor`, `/admin` و `/super-admin` به یک `ApplicationShell` client component وصل می‌شوند که header، navigation، logout و محتوای role-specific را فراهم می‌کند.

`ApplicationShell` از یک role/navigation contract واحد استفاده می‌کند. این contract فقط visibility و discoverability را کنترل می‌کند؛ تمام APIها و routeهای server همچنان authorization مستقل خود را حفظ می‌کنند.

## Routing and Session Contract

- ورود دانشجو به `/student` هدایت می‌شود.
- ورود استاد به `/instructor` هدایت می‌شود.
- ورود admin معمولی یا secretary به `/admin` هدایت می‌شود.
- ورود super admin به `/super-admin` هدایت می‌شود.
- routeهای private بدون session معتبر به `/` هدایت می‌شوند.
- role نامعتبر یا دسترسی ناکافی به `/` یا route نقش صحیح هدایت می‌شود.
- logout session را invalid می‌کند، state client را پاک می‌کند و به `/` می‌رود.
- private routes با `Cache-Control: no-store` ارائه می‌شوند تا back navigation محتوای محافظت‌شده را احیا نکند.

## Shared Shell

مسئولیت‌های مشترک:

- viewport ownership با `min-h-dvh w-full`
- app header با هویت نقش و logout
- responsive sidebar/drawer
- main content region
- active navigation state
- loading/error boundary
- RTL/LTR support
- keyboard focus and mobile touch targets

تفاوت نقش‌ها فقط از طریق navigation config و محتوای پنل اعمال می‌شود.

## Migration Safety

1. routeهای جدید ابتدا اضافه می‌شوند.
2. پنل‌های فعلی بدون تغییر business logic داخل Shell استفاده می‌شوند.
3. public page تا پایان migration untouched می‌ماند.
4. flagهای overlay فقط پس از اثبات routeهای جدید حذف یا بی‌اثر می‌شوند.
5. regressionهای auth، registration، RBAC، DB و browser بعد از هر مرحله اجرا می‌شوند.

## Acceptance Evidence

برای هر نقش باید route، viewport، screenshot، logout، direct URL و back-button بررسی شود. هر ادعای PASS باید هم‌زمان شواهد browser، API/server و در workflowهای داده‌ای شواهد DB داشته باشد.
