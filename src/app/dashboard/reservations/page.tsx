import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveVenueId } from "@/lib/venue-context";
import { getDayBounds } from "@/domain/availability/engine";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatTime } from "@/lib/utils";
import { STATUS_LABELS, statusBadgeVariant } from "@/lib/venue-context";

type Props = { searchParams: Promise<{ date?: string }> };

export default async function ReservationsPage({ searchParams }: Props) {
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
    },
    include: { guest: true, service: true },
    orderBy: { dateTime: "asc" },
  });

  const upcomingCount =
    selectedDate === today
      ? await prisma.reservation.count({
          where: {
            venueId,
            dateTime: { gt: end },
            status: { notIn: ["CANCELLED", "COMPLETED"] },
          },
        })
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Reservas</h2>
          <p className="text-zinc-500">{formatDate(start, timezone)}</p>
        </div>
        <form method="get" className="flex items-center gap-2">
          <input
            type="date"
            name="date"
            defaultValue={selectedDate}
            className="h-10 rounded-md border border-zinc-300 px-3 text-sm"
          />
          <button
            type="submit"
            className="h-10 rounded-md bg-zinc-900 px-4 text-sm text-white"
          >
            Filtrar
          </button>
        </form>
      </div>

      {upcomingCount > 0 && (
        <p className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-900">
          Tienes {upcomingCount} reserva{upcomingCount === 1 ? "" : "s"} en
          fechas futuras. Usa el filtro de fecha o abre{" "}
          <Link href="/dashboard/host" className="font-medium underline">
            Host View
          </Link>{" "}
          y selecciona el día de la reserva del widget.
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{reservations.length} reservas</CardTitle>
        </CardHeader>
        <CardContent>
          {reservations.length === 0 ? (
            <p className="text-sm text-zinc-500">No hay reservas este día.</p>
          ) : (
            <div className="divide-y divide-zinc-100">
              {reservations.map((r) => (
                <Link
                  key={r.id}
                  href={`/dashboard/reservations/${r.id}`}
                  className="flex items-center justify-between py-4 hover:bg-zinc-50"
                >
                  <div>
                    <p className="font-medium">
                      {r.guest.firstName} {r.guest.lastName ?? ""}
                    </p>
                    <p className="text-sm text-zinc-500">
                      {formatTime(r.dateTime, timezone)} · {r.partySize} pax ·{" "}
                      {r.service.name}
                    </p>
                  </div>
                  <Badge variant={statusBadgeVariant(r.status)}>
                    {STATUS_LABELS[r.status] ?? r.status}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
