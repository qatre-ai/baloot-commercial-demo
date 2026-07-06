# Task 1b - Fix date hydration errors in Workshops section

## Summary
Fixed hydration mismatches caused by `toLocaleDateString()` producing different output on Node.js server vs browser client, especially for the Persian "fa-IR" locale.

## Changes Made
**File**: `src/components/sections/workshops.tsx`

### WorkshopDetailModal (lines 75-77, 165)
- Added `const [mounted, setMounted] = useState(false);`
- Added `useEffect(() => { setMounted(true); }, []);`
- Changed date value in Quick Info Row from:
  ```
  new Date(workshop.date).toLocaleDateString(isRTL ? "fa-IR" : "en-US", { month: "long", day: "numeric" })
  ```
  to:
  ```
  mounted ? new Date(workshop.date).toLocaleDateString(isRTL ? "fa-IR" : "en-US", { month: "long", day: "numeric" }) : new Date(workshop.date).toISOString().split('T')[0]
  ```

### WorkshopsSection (lines 299-302, 422)
- Added `const [mounted, setMounted] = useState(false);`
- Added `useEffect(() => { setMounted(true); }, []);` with eslint-disable comment
- Changed date display in card from:
  ```
  new Date(workshop.date).toLocaleDateString(isRTL ? "fa-IR" : "en-US", { month: "long", day: "numeric", year: "numeric" })
  ```
  to:
  ```
  mounted ? new Date(workshop.date).toLocaleDateString(isRTL ? "fa-IR" : "en-US", { month: "long", day: "numeric", year: "numeric" }) : new Date(workshop.date).toISOString().split('T')[0]
  ```

## Result
- Zero lint errors
- Server renders ISO date strings (deterministic across server/client)
- Client switches to locale-formatted dates after hydration (mounted=true)
