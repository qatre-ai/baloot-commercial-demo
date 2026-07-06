# Task 5-b: Senior Frontend Developer — Fix HIGH PRIORITY UI/UX Issues

## Summary
Fixed 6 HIGH/MEDIUM/LOW priority UI/UX issues identified in the comprehensive audit (Task ID 4).

## Files Modified
- `src/components/sections/hero.tsx` — Issues 3.1/15.1, 3.5
- `src/components/sections/branches.tsx` — Issue 10.1
- `src/components/layout/footer.tsx` — Issues 12.1, 12.2
- `src/components/sections/testimonials.tsx` — Issue 8.4

## Changes Detail

### Hero Performance (Issue 3.1/15.1) — HIGH
- Added `prefers-reduced-motion` check via `useSyncExternalStore`
- Added continuous visibility tracking with `useInView(ref, { once: false })` 
- Reduced particles: 50 → 35 desktop, 20 mobile
- Reduced sound wave bars: 60 → 30 when reduced motion preferred
- Orbs and notes unmounted when off-screen or reduced motion
- Static fallbacks for particles and sound wave bars in reduced motion mode

### Persian Scroll Text (Issue 3.5) — LOW
- Conditionally apply `uppercase tracking-[0.3em]` only for LTR

### Directions Buttons (Issue 10.1) — HIGH
- Converted `<Button>` to `<a>` with Google Maps directions URL
- Uses branch address with proper encoding
- Locale-aware address selection

### Social Media Links (Issue 12.1) — HIGH
- Replaced `href="#"` with placeholder URLs + TODO comments
- Added `target="_blank"` and `rel="noopener noreferrer"`

### Footer CTA Mismatch (Issue 12.2) — MEDIUM
- Changed from `t.courses.view_all` to "مشاهده کارگاه‌ها" / "View Workshops"

### Console.error Removal (Issue 8.4) — MEDIUM
- Removed `console.error` from testimonials fetch error handler

## Verification
- `bun run lint` passes clean
- Dev server compiles successfully
