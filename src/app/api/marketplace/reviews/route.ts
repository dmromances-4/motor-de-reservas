import { NextRequest, NextResponse } from "next/server";
import { requireDiner } from "@/lib/auth";
import { reviewSchema } from "@/lib/validations";
import { submitReview } from "@/domain/marketplace/review-service";

export async function POST(request: NextRequest) {
  try {
    const session = await requireDiner();
    const body = await request.json();
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const review = await submitReview(
      parsed.data.reservationId,
      session.user.id,
      parsed.data.rating,
      parsed.data.comment,
    );

    return NextResponse.json({ review });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    const status =
      message === "UNAUTHORIZED" || message === "FORBIDDEN"
        ? 403
        : message === "NOT_FOUND"
          ? 404
          : message === "ALREADY_REVIEWED"
            ? 409
            : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
