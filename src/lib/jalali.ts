/**
 * Jalali (Shamsi) Date Utilities
 * Converts between Gregorian (ISO) and Jalali calendar dates
 * Uses jalaali-js library for accurate conversion
 */

import * as jalaali from "jalaali-js";

// Persian month names
export const JALALI_MONTHS_FA = [
  "فروردین", "اردیبهشت", "خرداد",
  "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر",
  "دی", "بهمن", "اسفند",
];

export const JALALI_MONTHS_EN = [
  "Farvardin", "Ordibehesht", "Khordad",
  "Tir", "Mordad", "Shahrivar",
  "Mehr", "Aban", "Azar",
  "Dey", "Bahman", "Esfand",
];

// Persian day of week names
export const JALALI_WEEKDAYS_FA = [
  "شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه",
];

/**
 * Convert ISO date string (YYYY-MM-DD) to Jalali object { jy, jm, jd }
 */
export function isoToJalaali(isoDate: string): { jy: number; jm: number; jd: number } | null {
  if (!isoDate) return null;
  try {
    const parts = isoDate.split("-").map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return null;
    const [gy, gm, gd] = parts;
    const result = jalaali.toJalaali(gy, gm, gd);
    return { jy: result.jy, jm: result.jm, jd: result.jd };
  } catch {
    return null;
  }
}

/**
 * Convert Jalali date to ISO date string (YYYY-MM-DD)
 */
export function jalaaliToIso(jy: number, jm: number, jd: number): string | null {
  try {
    if (!jalaali.isValidJalaaliDate(jy, jm, jd)) return null;
    const result = jalaali.toGregorian(jy, jm, jd);
    const gy = result.gy;
    const gm = String(result.gm).padStart(2, "0");
    const gd = String(result.gd).padStart(2, "0");
    return `${gy}-${gm}-${gd}`;
  } catch {
    return null;
  }
}

/**
 * Format ISO date to Jalali display string (e.g., "۱۴۰۳/۰۹/۱۵" or "15 آذر 1403")
 */
export function formatJalaaliDate(
  isoDate: string,
  isRTL: boolean,
  style: "short" | "long" = "short"
): string {
  const j = isoToJalaali(isoDate);
  if (!j) return isoDate;

  if (style === "long") {
    const monthName = isRTL ? JALALI_MONTHS_FA[j.jm - 1] : JALALI_MONTHS_EN[j.jm - 1];
    const day = isRTL ? toPersianDigits(j.jd) : j.jd;
    const year = isRTL ? toPersianDigits(j.jy) : j.jy;
    return isRTL ? `${day} ${monthName} ${year}` : `${day} ${monthName} ${year}`;
  }

  // Short format: YYYY/MM/DD
  const y = isRTL ? toPersianDigits(j.jy) : j.jy;
  const m = isRTL ? toPersianDigits(j.jm).padStart(2, "۰") : String(j.jm).padStart(2, "0");
  const d = isRTL ? toPersianDigits(j.jd).padStart(2, "۰") : String(j.jd).padStart(2, "0");
  return `${y}/${m}/${d}`;
}

/**
 * Convert Latin digits to Persian/Arabic digits
 */
export function toPersianDigits(num: number | string): string {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(num).replace(/\d/g, (d) => persianDigits[parseInt(d)]);
}

/**
 * Convert Persian/Arabic digits to Latin digits
 */
export function toLatinDigits(str: string): string {
  return str
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

/**
 * Get number of days in a Jalali month
 */
export function jalaaliMonthDays(jy: number, jm: number): number {
  return jalaali.jalaaliMonthLength(jy, jm);
}

/**
 * Get current Jalali date
 */
export function getCurrentJalaali(): { jy: number; jm: number; jd: number } {
  const now = new Date();
  const result = jalaali.toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  return { jy: result.jy, jm: result.jm, jd: result.jd };
}

/**
 * Check if a Jalali year is a leap year
 */
export function isJalaaliLeapYear(jy: number): boolean {
  return jalaali.isLeapJalaaliYear(jy);
}

/**
 * Calculate age from ISO date string
 */
export function calculateAge(isoDate: string): number | null {
  if (!isoDate) return null;
  try {
    const dob = new Date(isoDate);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age;
  } catch {
    return null;
  }
}
