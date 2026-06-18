import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { dinerSignupSchema } from "@/lib/validations";
import {
  awardSignupBonus,
  processReferral,
} from "@/domain/marketplace/loyalty-service";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = dinerSignupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const referralCode = `REF-${parsed.data.email.split("@")[0].slice(0, 6).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      name: parsed.data.name,
      passwordHash,
      accountType: "DINER",
      referralCode,
    },
  });

  await awardSignupBonus(user.id);

  const ref = parsed.data.referralCode ?? body.referralCode;
  if (typeof ref === "string" && ref.trim()) {
    await processReferral(ref.trim().toUpperCase(), user.id);
  }

  return NextResponse.json({
    user: { id: user.id, email: user.email, accountType: user.accountType },
  });
}
