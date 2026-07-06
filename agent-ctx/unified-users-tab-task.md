# Task: Create Unified Users Management Tab

## Summary
Created a new `unified-users-tab.tsx` component that merges the previous "کاربران" (Users) and "مدیران و مجوزها" (Admins & Permissions) tabs into a single unified tab with three sub-tabs.

## Files Created
- `src/components/admin/tabs/unified-users-tab.tsx` (1970 lines)

## Files Modified
- `src/components/admin/super-admin-panel.tsx`:
  - Added import for `UnifiedUsersTab`
  - Removed "admins" tab from TABS array
  - Replaced `<UsersTab isRTL={isRTL} />` with `<UnifiedUsersTab isRTL={isRTL} />`
  - Removed `<AdminsTab isRTL={isRTL} />` rendering

## Key Features
1. **Three Sub-tabs**: هنرجویان (Students), مدرسین (Instructors), مدیران (Admins)
2. **Students/Instructors**: Search, 7 filters (active, verified, instrument, skill level, gender, AI segment, registration status), sortable table, mobile card view, detail/edit/password reset/delete dialogs
3. **Admins**: Search, data table with role/permissions/lock status, create/edit/permission management/delete dialogs
4. **Permission Grid**: Full categorized permission management with templates, grant all/clear all, category/resource toggles
5. **Responsive**: Desktop table view + mobile card view
6. **All API calls correct**: Students API, Admins API, Permissions API
7. **Audit logging**: All admin actions logged via `logAuditAction`
8. **Bilingual**: Full isRTL support for all labels
9. **Lint: PASS**
