import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveVenueId } from "@/lib/venue-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatTime } from "@/lib/utils";

export default async function CommissionsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const venueId = await getActiveVenueId();
  if (!venueId) {
    return <p className="text-zinc-600">Sin local asignado.</p>;
  }

  const reservations = await prisma.reservation.findMany({
    where: { venueId, source: "MARKETPLACE" },
    include: { guest: true },
    orderBy: { dateTime: "desc" },
  });

  const totalCommission = reservations.reduce(
    (sum, r) => sum + (r.commissionAmountCents ?? 0),
    0,
  );
  const totalDeposits = reservations.reduce(
    (sum, r) => sum + (r.depositStatus === "PAID" ? (r.depositAmountCents ?? 0) : 0),
    0,
  );

  const venue = await prisma.venue.findUnique({
    where: { id: venueId },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Comisiones marketplace</h2>
        <p className="text-zinc-500">Reservas con origen MARKETPLACE</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-zinc-500">Comisiones totales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {(totalCommission / 100).toFixed(2)} €
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-zinc-500">Depósitos cobrados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {(totalDeposits / 100).toFixed(2)} €
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{reservations.length} reservas marketplace</CardTitle>
        </CardHeader>
        <CardContent>
          {reservations.length === 0 ? (
            <p className="text-sm text-zinc-500">Sin reservas del marketplace aún.</p>
          ) : (
            <div className="divide-y">
              {reservations.map((r) => (
                <div key={r.id} className="flex justify-between py-3 text-sm">
                  <div>
                    <p className="font-medium">
                      {r.guest.firstName} · {r.partySize} pax
                    </p>
                    <p className="text-zinc-500">
                      {formatDate(r.dateTime, venue?.timezone)} ·{" "}
                      {formatTime(r.dateTime, venue?.timezone)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p>
                      Comisión:{" "}
                      {((r.commissionAmountCents ?? 0) / 100).toFixed(2)} €
                    </p>
                    <p className="text-zinc-500">
                      Depósito:{" "}
                      {r.depositStatus === "PAID"
                        ? `${((r.depositAmountCents ?? 0) / 100).toFixed(2)} €`
                        : "—"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
