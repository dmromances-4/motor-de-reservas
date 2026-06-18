import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveVenueId } from "@/lib/venue-context";
import { countSegmentGuests } from "@/domain/crm/segment-service";
import { SegmentForm } from "@/components/dashboard/segment-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SegmentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const venueId = await getActiveVenueId();
  if (!venueId) return <p className="text-zinc-600">Sin local asignado.</p>;

  const segments = await prisma.guestSegment.findMany({
    where: { venueId },
    orderBy: { createdAt: "desc" },
  });

  const counts = await Promise.all(
    segments.map(async (s) => ({ id: s.id, count: await countSegmentGuests(s.id) })),
  );
  const countMap = Object.fromEntries(counts.map((c) => [c.id, c.count]));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Segmentos</h2>
        <p className="text-zinc-500">Audiencias para campañas de marketing</p>
      </div>

      <SegmentForm venueId={venueId} />

      <Card>
        <CardHeader>
          <CardTitle>{segments.length} segmentos</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {segments.map((s) => (
            <div key={s.id} className="flex justify-between py-3 text-sm">
              <div>
                <p className="font-medium">{s.name}</p>
                <p className="text-zinc-500">{JSON.stringify(s.filters)}</p>
              </div>
              <p className="font-semibold">{countMap[s.id] ?? 0} contactos</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
