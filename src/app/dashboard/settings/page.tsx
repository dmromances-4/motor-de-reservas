import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDashboardData } from "@/app/actions/dashboard";
import { VenueSettingsTabs } from "@/components/dashboard/venue-settings-tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

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
        <p className="text-zinc-500">Políticas y configuración del local</p>
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
          <CardTitle>Horarios por servicio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {venue.services.map((service) => (
            <div key={service.id}>
              <h3 className="mb-2 font-medium">{service.name}</h3>
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                {service.schedules.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-md border border-zinc-200 px-3 py-2"
                  >
                    <span className="font-medium">{DAYS[s.dayOfWeek]}</span>:{" "}
                    {s.openTime} – {s.closeTime}
                    {!s.isActive && (
                      <span className="ml-2 text-zinc-400">(inactivo)</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
