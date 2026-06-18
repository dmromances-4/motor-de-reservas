import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveVenueId } from "@/lib/venue-context";
import { ChannelStatsPanel } from "@/components/dashboard/channel-stats-panel";
import { IntegrationsCatalog } from "@/components/dashboard/integrations-catalog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  aggregateChannelStats,
  getChannelSummary,
} from "@/domain/integrations/channel-stats-service";
import type { IntegrationStatusContext } from "@/domain/integrations/status-service";

export default async function IntegrationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const venueId = await getActiveVenueId();
  if (!venueId) return <p className="text-zinc-600">Sin local asignado.</p>;

  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const [venue, posIntegrations, connections, reservations, syncLogs] =
    await Promise.all([
    prisma.venue.findUnique({
      where: { id: venueId },
      select: {
        slug: true,
        instagramUrl: true,
        tripAdvisorUrl: true,
        theForkUrl: true,
        tiktokUrl: true,
        isListedOnMarketplace: true,
      },
    }),
    prisma.posIntegration.findMany({ where: { venueId } }),
    prisma.integrationConnection.findMany({
      where: { venueId },
      select: { provider: true, status: true },
    }),
    prisma.reservation.findMany({
      where: {
        venueId,
        dateTime: { gte: yearStart },
        status: { notIn: ["CANCELLED"] },
      },
      select: { dateTime: true, partySize: true, source: true },
    }),
    prisma.posSyncLog.findMany({
      where: { integration: { venueId } },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { integration: { select: { provider: true } } },
    }),
  ]);

  if (!venue) return <p className="text-zinc-600">Local no encontrado.</p>;

  const statsMap = aggregateChannelStats(reservations, now);
  const summary = getChannelSummary(statsMap);

  const monthLabel = now.toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });

  const statusContext: IntegrationStatusContext = {
    venue,
    posIntegrations,
    connections,
    env: {
      resend: Boolean(process.env.RESEND_API_KEY),
      twilio: Boolean(
        process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN,
      ),
    },
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Integraciones</h2>
        <p className="text-zinc-500">
          Conecta canales, TPVs, marketing y herramientas de tu restaurante
        </p>
      </div>

      <ChannelStatsPanel summary={summary} monthLabel={monthLabel} />

      <IntegrationsCatalog
        venueId={venueId}
        venueSlug={venue.slug}
        statusContext={statusContext}
        statsMap={statsMap}
        posIntegrations={posIntegrations.map((p) => ({
          provider: p.provider,
          status: p.status,
          lastSyncAt: p.lastSyncAt?.toISOString() ?? null,
        }))}
        connections={connections}
      />

      <Card>
        <CardHeader>
          <CardTitle>Actividad reciente</CardTitle>
        </CardHeader>
        <CardContent>
          {syncLogs.length === 0 ? (
            <p className="text-sm text-zinc-500">Sin actividad de sync aún.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-zinc-500">
                    <th className="pb-2 pr-4">Fecha</th>
                    <th className="pb-2 pr-4">Proveedor</th>
                    <th className="pb-2 pr-4">Acción</th>
                    <th className="pb-2 pr-4">Estado</th>
                    <th className="pb-2">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {syncLogs.map((log) => (
                    <tr key={log.id} className="border-b border-zinc-100">
                      <td className="py-2 pr-4">
                        {log.createdAt.toLocaleString("es-ES")}
                      </td>
                      <td className="py-2 pr-4">{log.integration.provider}</td>
                      <td className="py-2 pr-4">{log.action}</td>
                      <td className="py-2 pr-4">{log.status}</td>
                      <td className="py-2 text-zinc-500">{log.error ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
