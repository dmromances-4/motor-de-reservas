import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireVenueAccess } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReservationActions } from "@/components/dashboard/reservation-actions";
import { formatDate, formatTime } from "@/lib/utils";
import { STATUS_LABELS, statusBadgeVariant } from "@/lib/venue-context";

type Props = { params: Promise<{ id: string }> };

export default async function ReservationDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: {
      guest: true,
      service: true,
      venue: true,
      statusHistory: { orderBy: { createdAt: "desc" } },
      tables: { include: { table: true } },
    },
  });

  if (!reservation) notFound();

  try {
    await requireVenueAccess(reservation.venueId);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/dashboard/reservations"
            className="text-sm text-zinc-500 hover:text-zinc-900"
          >
            ← Volver a reservas
          </Link>
          <h2 className="mt-2 text-2xl font-bold">
            {reservation.guest.firstName} {reservation.guest.lastName ?? ""}
          </h2>
          <p className="text-zinc-500">
            {formatDate(reservation.dateTime, reservation.venue.timezone)}{" "}
            · {formatTime(reservation.dateTime, reservation.venue.timezone)}
          </p>
        </div>
        <Badge variant={statusBadgeVariant(reservation.status)}>
          {STATUS_LABELS[reservation.status]}
        </Badge>
      </div>

      <ReservationActions
        reservationId={reservation.id}
        currentStatus={reservation.status}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Detalles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-zinc-500">Comensales:</span>{" "}
              {reservation.partySize}
            </p>
            <p>
              <span className="text-zinc-500">Servicio:</span>{" "}
              {reservation.service.name}
            </p>
            <p>
              <span className="text-zinc-500">Origen:</span> {reservation.source}
            </p>
            <p>
              <span className="text-zinc-500">Código:</span>{" "}
              {reservation.confirmationCode}
            </p>
            {reservation.notes && (
              <p>
                <span className="text-zinc-500">Notas:</span> {reservation.notes}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Comensal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>{reservation.guest.email}</p>
            <p>{reservation.guest.phone}</p>
            {reservation.guest.allergies && (
              <p className="text-amber-700">
                Alergias: {reservation.guest.allergies}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {reservation.statusHistory.map((h) => (
              <li key={h.id} className="flex justify-between border-b pb-2">
                <span>
                  {h.fromStatus ?? "—"} → {h.toStatus}
                  {h.note ? ` (${h.note})` : ""}
                </span>
                <span className="text-zinc-500">
                  {h.createdAt.toLocaleString("es-ES")}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
