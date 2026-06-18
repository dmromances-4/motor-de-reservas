import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";
import type { AccountType, UserRole } from "@/generated/prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      accountType: AccountType;
      loyaltyPoints: number;
      referralCode: string | null;
      isSuperAdmin: boolean;
      memberships: Array<{
        venueId: string;
        role: UserRole;
        venueName: string;
        venueSlug: string;
      }>;
    };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
          include: {
            memberships: {
              include: { venue: true },
            },
          },
        });

        if (!user) return null;

        const valid = await bcrypt.compare(
          parsed.data.password,
          user.passwordHash,
        );
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          accountType: user.accountType,
          loyaltyPoints: user.loyaltyPoints,
          referralCode: user.referralCode,
          isSuperAdmin: user.isSuperAdmin,
          memberships: user.memberships.map((m) => ({
            venueId: m.venueId,
            role: m.role,
            venueName: m.venue.name,
            venueSlug: m.venue.slug,
          })),
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.accountType = (user as { accountType?: AccountType }).accountType;
        token.loyaltyPoints = (user as { loyaltyPoints?: number }).loyaltyPoints;
        token.referralCode = (user as { referralCode?: string | null }).referralCode;
        token.isSuperAdmin = (user as { isSuperAdmin?: boolean }).isSuperAdmin;
        token.memberships = (user as { memberships?: unknown }).memberships;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.accountType = (token.accountType as AccountType) ?? "STAFF";
        session.user.loyaltyPoints = (token.loyaltyPoints as number) ?? 0;
        session.user.referralCode = (token.referralCode as string | null) ?? null;
        session.user.isSuperAdmin = Boolean(token.isSuperAdmin);
        session.user.memberships =
          (token.memberships as typeof session.user.memberships) ?? [];
      }
      return session;
    },
  },
});

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function requireDiner() {
  const session = await requireAuth();
  if (session.user.accountType !== "DINER") {
    throw new Error("FORBIDDEN");
  }
  return session;
}

export async function requireVenueAccess(venueId: string) {
  const session = await requireAuth();
  if (session.user.isSuperAdmin) {
    return { session, membership: null };
  }
  const membership = session.user.memberships.find(
    (m) => m.venueId === venueId,
  );
  if (!membership) {
    throw new Error("FORBIDDEN");
  }
  return { session, membership };
}
