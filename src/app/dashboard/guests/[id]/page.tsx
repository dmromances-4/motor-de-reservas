import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveVenueId } from "@/lib/venue-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GuestDetailForm } from "@/components/dashboard/guest-detail-form";
import { formatDate, formatTime } from "@/lib/utils";

type Props = { params: Promise<{ id: string }> };

export default async function GuestDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const venueId = await getActiveVenueId();
  if (!venueId) return <p className="text-zinc-600">Sin local asignado.</p>;

  const { id } = await params;
  const venue = await prisma.venue.findUnique({
    where: { id: venueId },
    select: { timezone: true },
  });
  const tz = venue?.timezone ?? "Europe/Madrid";

  const guest = await prisma.guest.findFirst({
    where: { id, venueId },
    include: {
      reservations: { orderBy: { dateTime: "desc" }, take: 20, include: { service: true } },
      guestNotes: { orderBy: { createdAt: "desc" }, take: 10 },
      campaignDeliveries: { orderBy: { createdAt: "desc" }, take: 10, include: { campaign: true } },
    },
  });
  if (!guest) notFound();

  return (
    <div className="space-y-6">
      <Link href="/dashboard/guests" className="text-sm text-zinc-500 hover:text-zinc-900">
        ← Volver a comensales
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">
            {guest.firstName} {guest.lastName ?? ""}
          </h2>
          <p className="text-zinc-500">
            {guest.email} {guest.phone ? `· ${guest.phone}` : ""}
          </p>
        </div>
        <div className="text-right text-sm text-zinc-500">
          <p>{guest.visitCount} visitas · {guest.noShowCount} no-shows</p>
          <p>{(guest.lifetimeSpendCents / 100).toFixed(2)} € lifetime</p>
        </div>
      </div>

      <GuestDetailForm
        venueId={venueId}
        guest={{
          id: guest.id,
          notes: guest.notes,
          allergies: guest.allergies,
          tags: guest.tags,
          marketingEmail: guest.marketingEmail,
          marketingSms: guest.marketingSms,
          marketingWhatsapp: guest.marketingWhatsapp,
        }}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Reservas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {guest.reservations.map((r) => (
              <div key={r.id} className="border-b border-zinc-100 py-2">
                {formatDate(r.dateTime, tz)} {formatTime(r.dateTime, tz)} ·{" "}
                {r.partySize} pax · {r.status}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actividad</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {guest.guestNotes.map((n) => (
              <p key={n.id}>
                <span className="text-zinc-400">{n.createdAt.toLocaleDateString()}</span> — {n.body}
              </p>
            ))}
            {guest.campaignDeliveries.map((d) => (
              <p key={d.id}>
                Campaña {d.campaign.name} ({d.channel}) — {d.status}
              </p>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
