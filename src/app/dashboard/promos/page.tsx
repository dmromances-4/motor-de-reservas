import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveVenueId } from "@/lib/venue-context";
import { PromoForm } from "@/components/dashboard/promo-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TogglePromoButton } from "@/components/dashboard/toggle-promo-button";
import { PromoQr } from "@/components/dashboard/promo-qr";

export default async function PromosPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const venueId = await getActiveVenueId();
  if (!venueId) return <p className="text-zinc-600">Sin local asignado.</p>;

  const promos = await prisma.promoCode.findMany({
    where: { venueId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { redemptions: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Descuentos</h2>
        <p className="text-zinc-500">Códigos promocionales para reservas</p>
      </div>

      <PromoForm venueId={venueId} />

      <Card>
        <CardHeader>
          <CardTitle>{promos.length} códigos</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {promos.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
              <div>
                <p className="font-mono font-semibold">{p.code}</p>
                <p className="text-zinc-500">
                  {p.type === "PERCENT" ? `${p.valuePercent}%` : `${((p.valueCents ?? 0) / 100).toFixed(2)} €`} ·{" "}
                  {p.usedCount}/{p.maxUses ?? "∞"} usos · {p._count.redemptions} redenciones
                </p>
              </div>
              <div className="flex flex-wrap items-start gap-4">
                <PromoQr promoId={p.id} code={p.code} />
                <TogglePromoButton venueId={venueId} promoId={p.id} isActive={p.isActive} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
