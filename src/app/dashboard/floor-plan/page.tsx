import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveVenueId } from "@/lib/venue-context";
import { FloorPlanEditor } from "@/components/dashboard/floor-plan-editor";

export default async function FloorPlanPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const venueId = await getActiveVenueId();
  if (!venueId) {
    return <p className="text-zinc-600">Sin local asignado.</p>;
  }

  const zones = await prisma.zone.findMany({
    where: { venueId },
    include: {
      tables: { orderBy: { name: "asc" } },
    },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Mapa de mesas</h2>
        <p className="text-zinc-500">
          Arrastra las mesas para organizar el salón. Activa modo mesas en Ajustes.
        </p>
      </div>
      <FloorPlanEditor venueId={venueId} zones={zones} />
    </div>
  );
}
