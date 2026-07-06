import { NextRequest, NextResponse } from "next/server";

// POST /api/payments/gateway — DEPRECATED: No online payment gateway is used.
// Registrations default to "unpaid" status. Admin manually changes to "paid" after follow-up.
// This route is kept as a stub returning an error for any gateway attempts.
export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      error: "درگاه پرداخت آنلاین فعال نیست. پرداخت‌ها به صورت حضوری/کارت به کارت انجام می‌شود.",
      message: "Online payment gateway is not available. Payments are handled manually by admin.",
    },
    { status: 400 }
  );
}
