# Task: Add CREATE and EDIT capabilities to ClassSchedulesTab

## Summary
Added create and edit functionality to the super admin's ClassSchedulesTab in `/home/z/my-project/src/components/admin/super-admin-panel.tsx`.

## Changes Made

### 1. Added `ScheduleForm` component (lines ~4782-4964)
A new reusable form component that supports both create and edit modes via an `initialData` prop:
- **Fields**: courseId (Select), instructorId (Select), branchId (Select), dayOfWeek (Select with PERSIAN_DAYS_SA), startTime (time input), endTime (time input), isRecurring (Switch), specificDate (date input, shown only when isRecurring=false), room (text input), capacity (number input), sessionNumber (number input), notes (textarea), status (Select, only shown in edit mode)
- **Create mode**: When `initialData` is null, the form creates a new schedule
- **Edit mode**: When `initialData` is provided, fields are pre-populated and a status dropdown appears

### 2. Added state variables to ClassSchedulesTab
- `branches` - fetched from courses data (extracted using Map like admin-panel.tsx pattern)
- `showCreate` - boolean for create dialog visibility
- `editingSchedule` - ClassScheduleEntry | null for edit dialog
- `isSaving` - boolean for loading state during save operations

### 3. Added handler functions
- `handleCreateSave` - POSTs to `/api/admin/class-schedules` with form data
- `handleEditSave` - PATCHes to `/api/admin/class-schedules/${id}` with form data

### 4. Updated `fetchFilters` 
- Now extracts branches from courses data (same pattern as admin-panel.tsx)
- Fixed course list extraction to prioritize `d.courses` key

### 5. Added UI elements
- **"New Schedule" button** at top of tab (Plus icon + "برنامه جدید"/"New Schedule")
- **Edit button** per schedule row (Edit3 icon, positioned before cancel button)
- **Create Schedule Dialog** with ScheduleForm
- **Edit Schedule Dialog** with ScheduleForm pre-populated
- Both dialogs show Loader2 spinner during save operations

### 6. Layout change
- Header changed from simple flex row to `justify-between` layout to accommodate the "New Schedule" button on the right side

## API Compatibility
- Create: POST `/api/admin/class-schedules` - sends all required fields, status defaults to "active" on server
- Edit: PATCH `/api/admin/class-schedules/${id}` - sends all fields including status
- Both handlers properly handle branchId (converts "none" to null), capacity (converts to number), and specificDate (only sent when isRecurring=false)

## Lint Result
✅ No errors - `bun run lint` passed cleanly
