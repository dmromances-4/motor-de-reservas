import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveVenueId } from "@/lib/venue-context";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ReservationActions } from "@/components/dashboard/reservation-actions";
import { HostViewTabs } from "@/components/dashboard/host-view-tabs";
import { formatTime } from "@/lib/utils";
import { STATUS_LABELS, statusBadgeVariant } from "@/lib/venue-context";

export default async function HostPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const venueId = await getActiveVenueId();
  if (!venueId) {
    return <p className="text-zinc-600">Sin local asignado.</p>;
  }

  const today = new Date().toISOString().slice(0, 10);
  const start = new Date(`${today}T00:00:00`);
  const end = new Date(`${today}T23:59:59`);

  const venue = await prisma.venue.findUnique({
    where: { id: venueId },
  });

  const reservations = await prisma.reservation.findMany({
    where: {
      venueId,
      dateTime: { gte: start, lte: end },
      status: { notIn: ["CANCELLED"] },
    },
    include: { guest: true, service: true },
    orderBy: { dateTime: "asc" },
  });

  const byHour = new Map<string, { covers: number; count: number }>();
  for (const r of reservations) {
    const hour = formatTime(r.dateTime, venue?.timezone).slice(0, 2);
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
    timeLabel: formatTime(r.dateTime, venue?.timezone),
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
      <div>
        <h2 className="text-2xl font-bold">Host View</h2>
        <p className="text-zinc-500">Servicio de hoy</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {Array.from(byHour.entries()).map(([hour, stats]) => (
          <Card key={hour}>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold">{hour}:00</p>
              <p className="text-sm text-zinc-500">
                {stats.covers} cubiertos · {stats.count} reservas
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <HostViewTabs
        venueId={venueId}
        venueSlug={venue?.slug}
        reservations={reservationRows}
      />
    </div>
  );
}
