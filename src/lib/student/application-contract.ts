export type StudentProfileInput = {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
};

export type StudentProfileErrors = {
  name?: string;
  phone?: string;
  email?: string;
};

export function validateStudentProfile(input: StudentProfileInput): StudentProfileErrors {
  const errors: StudentProfileErrors = {};
  if (!input.name?.trim()) {
    errors.name = "نام الزامی است";
  }
  if (!input.phone?.trim() || !/^(\+98|0098|98|0)?9\d{9}$/.test(input.phone.replace(/[\s-]/g, ""))) {
    errors.phone = "شماره تماس معتبر نیست";
  }
  if (!input.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    errors.email = "ایمیل معتبر نیست";
  }
  return errors;
}

export type WorkshopAvailabilityInput = {
  registrationOpen: boolean;
  reservedSeats: number;
  totalSeats: number;
};

export function getWorkshopAvailability(input: WorkshopAvailabilityInput) {
  const remainingSeats = Math.max(0, input.totalSeats - input.reservedSeats);
  if (!input.registrationOpen) {
    return { state: "closed" as const, remainingSeats };
  }
  if (remainingSeats === 0) {
    return { state: "full" as const, remainingSeats };
  }
  return { state: "available" as const, remainingSeats };
}

export function getRegistrationErrorMessage(error: string | null | undefined): string {
  const normalized = error?.toLowerCase() ?? "";
  if (normalized.includes("capacity") || normalized.includes("no seats")) {
    return "ظرفیت کلاس تکمیل شده است";
  }
  if (normalized.includes("already")) {
    return "این مورد قبلاً برای شما ثبت شده است";
  }
  if (normalized.includes("closed") || normalized.includes("ended")) {
    return "مهلت ثبت‌نام به پایان رسیده است";
  }
  if (normalized.includes("login") || normalized.includes("unauthorized")) {
    return "برای ادامه ابتدا وارد حساب کاربری شوید";
  }
  return "عملیات انجام نشد. دوباره تلاش کنید.";
}

export function getPaymentStatusLabel(status: string, isRTL: boolean): string {
  const labels: Record<string, [string, string]> = {
    paid: ["پرداخت شده", "Paid"],
    unpaid: ["پرداخت نشده", "Unpaid"],
    partial: ["پرداخت جزئی", "Partial"],
    waived: ["معاف", "Waived"],
    pending: ["در انتظار", "Pending"],
    overdue: ["سررسید گذشته", "Overdue"],
    failed: ["ناموفق", "Failed"],
    refunded: ["بازگشت داده شده", "Refunded"],
  };
  const label = labels[status];
  return label ? (isRTL ? label[0] : label[1]) : status;
}
