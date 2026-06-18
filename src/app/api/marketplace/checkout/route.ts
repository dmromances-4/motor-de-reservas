import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkoutSchema } from "@/lib/validations";
import { createDepositCheckoutSession } from "@/domain/payments/stripe-service";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const session = await auth();

  try {
    const result = await createDepositCheckoutSession({
      ...parsed.data,
      dinerUserId:
        session?.user?.accountType === "DINER" ? session.user.id : undefined,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    const status =
      message === "STRIPE_NOT_CONFIGURED"
        ? 503
        : message === "NO_DEPOSIT_REQUIRED"
          ? 400
          : message === "RESTAURANT_NOT_FOUND"
            ? 404
            : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
