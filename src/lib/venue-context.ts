import { cookies } from "next/headers";
import { auth } from "@/lib/auth";

export async function getActiveVenueId(): Promise<string | null> {
  const session = await auth();
  if (!session?.user) return null;

  const cookieStore = await cookies();
  const fromCookie =
    cookieStore.get("activeVenueId")?.value ??
    cookieStore.get("activeRestaurantId")?.value;
  if (
    fromCookie &&
    (session.user.isSuperAdmin ||
      session.user.memberships.some((m) => m.venueId === fromCookie))
  ) {
    return fromCookie;
  }

  return session.user.memberships[0]?.venueId ?? null;
}

export function statusBadgeVariant(status: string) {
  switch (status) {
    case "CONFIRMED":
      return "success" as const;
    case "PENDING":
      return "warning" as const;
    case "SEATED":
      return "default" as const;
    case "CANCELLED":
    case "NO_SHOW":
      return "destructive" as const;
    default:
      return "secondary" as const;
  }
}

export const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmada",
  SEATED: "Sentados",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
  NO_SHOW: "No show",
};
