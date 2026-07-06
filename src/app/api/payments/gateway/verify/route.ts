import { NextResponse } from "next/server";

// POST /api/payments/gateway/verify — DEPRECATED: No online payment gateway is used.
// This route is kept as a stub returning an error for any gateway verification attempts.
export async function POST() {
  return NextResponse.json(
    {
      error: "درگاه پرداخت آنلاین فعال نیست.",
      message: "Online payment gateway is not available. Payment status is managed manually by admin.",
    },
    { status: 400 }
  );
}
