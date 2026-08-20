const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export function normalizeDigits(value: string): string {
  return value.replace(/[۰-۹٠-٩]/g, (digit) => {
    const persianIndex = PERSIAN_DIGITS.indexOf(digit);
    if (persianIndex >= 0) return String(persianIndex);
    return String(ARABIC_DIGITS.indexOf(digit));
  });
}

export function normalizeIranianPhone(value: string): string {
  const normalized = normalizeDigits(value).trim().replace(/[^\d+]/g, "");

  if (normalized.startsWith("+98")) return `0${normalized.slice(3)}`;
  if (normalized.startsWith("0098")) return `0${normalized.slice(4)}`;
  return normalized;
}

export function isValidIranianMobile(value: string): boolean {
  return /^09\d{9}$/.test(normalizeIranianPhone(value));
}

export function isValidIranianNationalId(value: string): boolean {
  const nationalId = normalizeDigits(value).trim();
  if (!/^\d{10}$/.test(nationalId) || /^(\d)\1{9}$/.test(nationalId)) return false;

  const checksum = [...nationalId.slice(0, 9)].reduce(
    (sum, digit, index) => sum + Number(digit) * (10 - index),
    0
  ) % 11;
  const expected = checksum < 2 ? checksum : 11 - checksum;
  return Number(nationalId[9]) === expected;
}
