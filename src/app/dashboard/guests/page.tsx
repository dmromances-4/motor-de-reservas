import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveVenueId } from "@/lib/venue-context";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function GuestsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const venueId = await getActiveVenueId();
  if (!venueId) {
    return <p className="text-zinc-600">Sin local asignado.</p>;
  }

  const guests = await prisma.guest.findMany({
    where: { venueId },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Comensales</h2>
        <p className="text-zinc-500">CRM básico de clientes</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{guests.length} fichas</CardTitle>
        </CardHeader>
        <CardContent>
          {guests.length === 0 ? (
            <p className="text-sm text-zinc-500">Aún no hay comensales.</p>
          ) : (
            <div className="divide-y divide-zinc-100">
              {guests.map((g) => (
                <div
                  key={g.id}
                  className="flex flex-wrap items-start justify-between gap-3 py-4"
                >
                  <div>
                    <Link
                      href={`/dashboard/guests/${g.id}`}
                      className="font-medium hover:underline"
                    >
                      {g.firstName} {g.lastName ?? ""}
                    </Link>
                    <p className="text-sm text-zinc-500">
                      {g.email} {g.phone ? `· ${g.phone}` : ""}
                    </p>
                    {g.notes && (
                      <p className="mt-1 text-sm text-zinc-600">{g.notes}</p>
                    )}
                    {g.tags.length > 0 && (
                      <div className="mt-2 flex gap-1">
                        {g.tags.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right text-sm text-zinc-500">
                    <p>{g.visitCount} visitas</p>
                    <p>{g.noShowCount} no-shows</p>
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
