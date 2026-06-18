import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getActiveVenueId } from "@/lib/venue-context";
import { getDashboardStats } from "@/domain/reservations/service";

const SOURCE_LABELS: Record<string, string> = {
  WIDGET: "Widget propio",
  PHONE: "Teléfono",
  WALK_IN: "Walk-in",
  MARKETPLACE: "Marketplace",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendientes",
  CONFIRMED: "Confirmadas",
  SEATED: "Sentadas",
  COMPLETED: "Completadas",
  CANCELLED: "Canceladas",
  NO_SHOW: "No-shows",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const venueId = await getActiveVenueId();
  if (!venueId) {
    return (
      <p style={{ color: "var(--muted)" }}>No tienes ningún local asignado.</p>
    );
  }

  const stats = await getDashboardStats(venueId);
  const membership = session.user.memberships.find(
    (m) => m.venueId === venueId,
  );

  const statusCount = (status: string) =>
    stats.byStatus.find((s) => s.status === status)?._count ?? 0;

  const noShows = statusCount("NO_SHOW");
  const cancellations = statusCount("CANCELLED");
  const weekTotalWithCancel = stats.byStatus.reduce(
    (acc, s) => acc + (s._count as number),
    0,
  );
  const noShowRate =
    weekTotalWithCancel > 0
      ? Math.round((noShows / weekTotalWithCancel) * 100)
      : 0;

  const heroMetrics = [
    { label: "Reservas hoy", value: stats.todayCount, hint: "En el día de hoy" },
    { label: "Reservas semana", value: stats.weekCount, hint: "Últimos 7 días" },
    { label: "No-shows", value: noShows, hint: `${noShowRate}% de la semana` },
    {
      label: "Cancelaciones",
      value: cancellations,
      hint: "Últimos 7 días",
    },
  ];

  const maxSource = Math.max(1, ...stats.bySource.map((s) => s._count as number));
  const sourcesSorted = [...stats.bySource].sort(
    (a, b) => (b._count as number) - (a._count as number),
  );

  const statusForBreakdown = stats.byStatus
    .filter((s) => s.status !== "CANCELLED")
    .sort((a, b) => (b._count as number) - (a._count as number));
  const maxStatus = Math.max(
    1,
    ...statusForBreakdown.map((s) => s._count as number),
  );

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header
        className="animate-rise flex flex-wrap items-end justify-between gap-4"
        style={{ animationDelay: "0ms" }}
      >
        <div>
          <p
            className="text-[0.65rem] font-semibold uppercase tracking-[0.24em]"
            style={{ color: "var(--teal-deep)" }}
          >
            Panel
          </p>
          <h2
            className="font-display mt-1.5 text-3xl font-semibold leading-none"
            style={{ color: "var(--ink)" }}
          >
            Resumen
          </h2>
          <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
            {membership?.venueName} · métricas de la semana
          </p>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {heroMetrics.map((metric, i) => (
          <article
            key={metric.label}
            className="animate-rise shadow-soft rounded-2xl px-5 py-5"
            style={{
              animationDelay: `${70 + i * 60}ms`,
              backgroundColor: "var(--surface)",
              border: "1px solid var(--line)",
            }}
          >
            <p
              className="text-[0.7rem] font-semibold uppercase tracking-[0.14em]"
              style={{ color: "var(--muted-2)" }}
            >
              {metric.label}
            </p>
            <p
              className="font-display mt-3 text-4xl font-semibold leading-none"
              style={{ color: "var(--ink)" }}
            >
              {metric.value}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <span
                className="h-[3px] w-6 rounded-full"
                style={{ backgroundColor: "var(--teal)" }}
              />
              <span className="text-xs" style={{ color: "var(--muted)" }}>
                {metric.hint}
              </span>
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-5">
        <article
          className="animate-rise shadow-soft rounded-2xl px-6 py-6 lg:col-span-3"
          style={{
            animationDelay: "340ms",
            backgroundColor: "var(--surface)",
            border: "1px solid var(--line)",
          }}
        >
          <div className="flex items-baseline justify-between">
            <h3
              className="font-display text-xl font-semibold"
              style={{ color: "var(--ink)" }}
            >
              Origen de reservas
            </h3>
            <span className="text-xs" style={{ color: "var(--muted)" }}>
              7 días
            </span>
          </div>

          {sourcesSorted.length === 0 ? (
            <p className="mt-6 text-sm" style={{ color: "var(--muted)" }}>
              Aún no hay reservas esta semana.
            </p>
          ) : (
            <ul className="mt-6 space-y-5">
              {sourcesSorted.map((item, i) => {
                const count = item._count as number;
                const pct = Math.round((count / maxSource) * 100);
                return (
                  <li key={item.source}>
                    <div className="mb-1.5 flex items-baseline justify-between">
                      <span
                        className="text-sm font-medium"
                        style={{ color: "var(--text)" }}
                      >
                        {SOURCE_LABELS[item.source] ?? item.source}
                      </span>
                      <span
                        className="font-display text-base font-semibold"
                        style={{ color: "var(--ink)" }}
                      >
                        {count}
                      </span>
                    </div>
                    <div
                      className="h-2.5 w-full overflow-hidden rounded-full"
                      style={{ backgroundColor: "var(--bg-2)" }}
                    >
                      <div
                        className="animate-bar h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          animationDelay: `${440 + i * 80}ms`,
                          background:
                            "linear-gradient(90deg, var(--teal) 0%, var(--indigo) 130%)",
                        }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </article>

        <article
          className="animate-rise shadow-soft rounded-2xl px-6 py-6 lg:col-span-2"
          style={{
            animationDelay: "420ms",
            backgroundColor: "var(--ink)",
            border: "1px solid var(--ink)",
          }}
        >
          <h3
            className="font-display text-xl font-semibold"
            style={{ color: "#ffffff" }}
          >
            Estado de la semana
          </h3>
          <p
            className="mt-1 text-xs"
            style={{ color: "rgba(223, 226, 242, 0.5)" }}
          >
            Reservas por estado (7 días)
          </p>

          {statusForBreakdown.length === 0 ? (
            <p
              className="mt-6 text-sm"
              style={{ color: "rgba(223, 226, 242, 0.6)" }}
            >
              Sin datos todavía.
            </p>
          ) : (
            <ul className="mt-5 space-y-4">
              {statusForBreakdown.map((item, i) => {
                const count = item._count as number;
                const pct = Math.round((count / maxStatus) * 100);
                return (
                  <li key={item.status}>
                    <div className="mb-1.5 flex items-baseline justify-between">
                      <span
                        className="text-sm"
                        style={{ color: "rgba(223, 226, 242, 0.82)" }}
                      >
                        {STATUS_LABELS[item.status] ?? item.status}
                      </span>
                      <span
                        className="font-display text-base font-semibold"
                        style={{ color: "#ffffff" }}
                      >
                        {count}
                      </span>
                    </div>
                    <div
                      className="h-2 w-full overflow-hidden rounded-full"
                      style={{ backgroundColor: "rgba(223,226,242,0.12)" }}
                    >
                      <div
                        className="animate-bar h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          animationDelay: `${540 + i * 80}ms`,
                          backgroundColor: "var(--teal)",
                        }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </article>
      </section>
    </div>
  );
}
