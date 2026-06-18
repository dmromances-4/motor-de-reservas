import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signupSchema } from "@/lib/validations";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = signupSchema.safeParse(body);
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
  let slug = slugify(parsed.data.venueName);
  const slugTaken = await prisma.venue.findUnique({ where: { slug } });
  if (slugTaken) slug = `${slug}-${Date.now().toString(36)}`;

  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      name: parsed.data.name,
      passwordHash,
      accountType: "STAFF",
      memberships: {
        create: {
          role: "OWNER",
          venue: {
            create: {
              name: parsed.data.venueName,
              slug,
              organization: {
                create: { name: parsed.data.venueName },
              },
              services: {
                create: [
                  {
                    name: "Comida",
                    sortOrder: 0,
                    durationMinutes: 90,
                    schedules: {
                      create: [1, 2, 3, 4, 5, 6].map((day) => ({
                        dayOfWeek: day,
                        openTime: "13:00",
                        closeTime: "16:00",
                      })),
                    },
                  },
                  {
                    name: "Cena",
                    sortOrder: 1,
                    durationMinutes: 120,
                    schedules: {
                      create: [0, 1, 2, 3, 4, 5, 6].map((day) => ({
                        dayOfWeek: day,
                        openTime: "20:00",
                        closeTime: "23:30",
                      })),
                    },
                  },
                ],
              },
            },
          },
        },
      },
    },
    include: {
      memberships: { include: { venue: true } },
    },
  });

  return NextResponse.json({
    user: { id: user.id, email: user.email },
    venue: user.memberships[0]?.venue,
  });
}
