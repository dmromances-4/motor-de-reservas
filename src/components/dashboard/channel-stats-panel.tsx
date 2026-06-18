import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PeriodStats } from "@/domain/integrations/channel-stats-service";

export function ChannelStatsPanel({
  summary,
  monthLabel,
}: {
  summary: PeriodStats;
  monthLabel: string;
}) {
  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Resumen de canales</CardTitle>
        <p className="text-sm text-zinc-600">
          Reservas y comensales recibidos por tus canales activos en {monthLabel}.
        </p>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-6">
        <div>
          <p className="text-3xl font-bold text-zinc-900">{summary.covers}</p>
          <p className="text-sm text-zinc-500">Comensales este mes</p>
        </div>
        <div>
          <p className="text-3xl font-bold text-zinc-900">{summary.reservations}</p>
          <p className="text-sm text-zinc-500">Reservas este mes</p>
        </div>
        <div className="ml-auto rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm">
          <p className="font-medium text-amber-900">Channel Manager</p>
          <p className="text-xs text-zinc-500">Próximamente — centraliza todos tus canales</p>
        </div>
      </CardContent>
    </Card>
  );
}
