import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveVenueId } from "@/lib/venue-context";
import { getDayBounds } from "@/domain/availability/engine";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ReservationActions } from "@/components/dashboard/reservation-actions";
import { HostViewTabs } from "@/components/dashboard/host-view-tabs";
import { HostDateFilter } from "@/components/dashboard/host-date-filter";
import { formatDate, formatTime } from "@/lib/utils";
import { STATUS_LABELS, statusBadgeVariant } from "@/lib/venue-context";

type Props = { searchParams: Promise<{ date?: string }> };

export default async function HostPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const venueId = await getActiveVenueId();
  if (!venueId) {
    return <p className="text-zinc-600">Sin local asignado.</p>;
  }

  const { date } = await searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const selectedDate = date ?? today;

  const venue = await prisma.venue.findUnique({
    where: { id: venueId },
  });

  const timezone = venue?.timezone ?? "Europe/Madrid";
  const { start, end } = getDayBounds(selectedDate, timezone);

  const reservations = await prisma.reservation.findMany({
    where: {
      venueId,
      dateTime: { gte: start, lt: end },
      status: { notIn: ["CANCELLED"] },
    },
    include: { guest: true, service: true },
    orderBy: { dateTime: "asc" },
  });

  const byHour = new Map<string, { covers: number; count: number }>();
  for (const r of reservations) {
    const hour = formatTime(r.dateTime, timezone).slice(0, 2);
    const entry = byHour.get(hour) ?? { covers: 0, count: 0 };
    entry.covers += r.partySize;
    entry.count += 1;
    byHour.set(hour, entry);
  }

  const reservationRows = reservations.map((r) => ({
    id: r.id,
    partySize: r.partySize,
    guestName: `${r.guest.firstName} ${r.guest.lastName ?? ""}`.trim(),
    serviceName: r.service.name,
    timeLabel: formatTime(r.dateTime, timezone),
    actions: (
      <>
        <Badge variant={statusBadgeVariant(r.status)}>
          {STATUS_LABELS[r.status]}
        </Badge>
        <ReservationActions reservationId={r.id} currentStatus={r.status} />
      </>
    ),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Host View</h2>
          <p className="text-zinc-500">
            Servicio del {formatDate(start, timezone)}
          </p>
        </div>
        <Suspense fallback={null}>
          <HostDateFilter defaultDate={today} />
        </Suspense>
      </div>

      {selectedDate !== today && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Mostrando reservas del {formatDate(start, timezone)}. Las reservas del
          widget suelen ser en fechas futuras: selecciona aquí el día correcto.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-4">
        {byHour.size === 0 ? (
          <Card className="sm:col-span-4">
            <CardContent className="pt-6 text-sm text-zinc-500">
              No hay reservas activas este día.
            </CardContent>
          </Card>
        ) : (
          Array.from(byHour.entries()).map(([hour, stats]) => (
            <Card key={hour}>
              <CardContent className="pt-6">
                <p className="text-2xl font-bold">{hour}:00</p>
                <p className="text-sm text-zinc-500">
                  {stats.covers} cubiertos · {stats.count} reservas
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <HostViewTabs
        venueId={venueId}
        venueSlug={venue?.slug}
        reservations={reservationRows}
      />
    </div>
  );
}
