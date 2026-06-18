import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { ReviewForm } from "@/components/marketplace/review-form";
import { formatDate, formatTime } from "@/lib/utils";
import { STATUS_LABELS, statusBadgeVariant } from "@/lib/venue-context";

export default async function AccountReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/account/login");

  const { payment } = await searchParams;

  const reservations = await prisma.reservation.findMany({
    where: { dinerUserId: session.user.id },
    include: {
      venue: true,
      service: true,
      review: true,
    },
    orderBy: { dateTime: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Mis reservas</h1>
      {payment === "success" && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Pago completado. Tu reserva ha sido confirmada.
        </p>
      )}
      {reservations.length === 0 ? (
        <p className="text-zinc-500">
          Aún no tienes reservas.{" "}
          <Link href="/explore" className="underline">
            Explorar locales
          </Link>
        </p>
      ) : (
        <div className="space-y-4">
          {reservations.map((r) => (
            <div
              key={r.id}
              className="rounded-xl border border-zinc-200 bg-white p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link
                    href={`/venues/${r.venue.slug}`}
                    className="font-semibold hover:underline"
                  >
                    {r.venue.name}
                  </Link>
                  <p className="text-sm text-zinc-500">
                    {formatDate(r.dateTime, r.venue.timezone)} ·{" "}
                    {formatTime(r.dateTime, r.venue.timezone)} ·{" "}
                    {r.partySize} pax
                  </p>
                  <p className="text-xs text-zinc-400">
                    Código: {r.confirmationCode}
                  </p>
                </div>
                <Badge variant={statusBadgeVariant(r.status)}>
                  {STATUS_LABELS[r.status]}
                </Badge>
              </div>
              {r.status === "COMPLETED" &&
                r.source === "MARKETPLACE" &&
                !r.review && (
                  <div className="mt-4">
                    <ReviewForm reservationId={r.id} />
                  </div>
                )}
              {r.review && (
                <p className="mt-2 text-sm text-amber-600">
                  Tu reseña: {"★".repeat(r.review.rating)}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
