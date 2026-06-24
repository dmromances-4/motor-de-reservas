import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDashboardData } from "@/app/actions/dashboard";
import { VenueSettingsTabs } from "@/components/dashboard/venue-settings-tabs";
import { ServiceSettingsPanel } from "@/components/dashboard/service-settings-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = { searchParams: Promise<{ tab?: string }> };

export default async function SettingsPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { tab } = await searchParams;
  const venue = await getDashboardData();
  if (!venue) {
    return <p className="text-zinc-600">Sin local asignado.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Ajustes</h2>
        <p className="text-zinc-500">Políticas, turnos y configuración del local</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Perfil y políticas</CardTitle>
        </CardHeader>
        <CardContent>
          <VenueSettingsTabs venue={venue} initialTab={tab} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Servicios y turnos</CardTitle>
        </CardHeader>
        <CardContent>
          <ServiceSettingsPanel venueId={venue.id} services={venue.services} />
        </CardContent>
      </Card>
    </div>
  );
}
