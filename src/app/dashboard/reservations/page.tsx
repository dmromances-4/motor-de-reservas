import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveVenueId } from "@/lib/venue-context";
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
  const selectedDate =
    date ?? new Date().toISOString().slice(0, 10);

  const start = new Date(`${selectedDate}T00:00:00`);
  const end = new Date(`${selectedDate}T23:59:59`);

  const venue = await prisma.venue.findUnique({
    where: { id: venueId },
  });

  const reservations = await prisma.reservation.findMany({
    where: {
      venueId,
      dateTime: { gte: start, lte: end },
    },
    include: { guest: true, service: true },
    orderBy: { dateTime: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Reservas</h2>
          <p className="text-zinc-500">
            {formatDate(start, venue?.timezone ?? "Europe/Madrid")}
          </p>
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
                      {formatTime(r.dateTime, venue?.timezone)} ·{" "}
                      {r.partySize} pax · {r.service.name}
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
