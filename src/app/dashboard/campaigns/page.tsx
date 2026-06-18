import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveVenueId } from "@/lib/venue-context";
import { CampaignForm } from "@/components/dashboard/campaign-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function CampaignsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const venueId = await getActiveVenueId();
  if (!venueId) return <p className="text-zinc-600">Sin local asignado.</p>;

  const [campaigns, segments, promos] = await Promise.all([
    prisma.campaign.findMany({
      where: { venueId },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { deliveries: true } } },
    }),
    prisma.guestSegment.findMany({ where: { venueId } }),
    prisma.promoCode.findMany({ where: { venueId, isActive: true } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Campañas</h2>
        <p className="text-zinc-500">Email, SMS y WhatsApp a segmentos con consentimiento</p>
      </div>

      <CampaignForm venueId={venueId} segments={segments} promos={promos} />

      <Card>
        <CardHeader>
          <CardTitle>{campaigns.length} campañas</CardTitle>
        </CardHeader>
        <CardContent className="divide-y text-sm">
          {campaigns.map((c) => (
            <div key={c.id} className="flex justify-between py-3">
              <div>
                <p className="font-medium">{c.name}</p>
                <p className="text-zinc-500">
                  {c.channels.join(", ")} · {c.status} · {c._count.deliveries} envíos
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
