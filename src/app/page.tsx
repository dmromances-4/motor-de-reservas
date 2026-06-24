import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/ui/wordmark";

const stats = [
  { value: "24/7", label: "Reservas sin interrupción" },
  { value: "0%", label: "Comisiones por reserva directa" },
  { value: "-15%", label: "No-shows con recordatorios" },
];

const features = [
  {
    title: "Motor anti-overbooking",
    desc: "Disponibilidad en tiempo real con control de turnos, mesas y aforo.",
  },
  {
    title: "Widget embebible",
    desc: "Tu web acepta reservas directas con tu marca, sin intermediarios.",
  },
  {
    title: "Panel de operaciones",
    desc: "Sala, comensales, campañas y métricas en un único lugar.",
  },
];

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Wordmark />
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/explore">Explorar locales</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/login">Acceder</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24 pt-10">
        <section className="animate-rise mx-auto max-w-3xl text-center">
          <span
            className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold"
            style={{
              backgroundColor: "var(--teal-soft)",
              color: "var(--teal-deep)",
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: "var(--teal)" }}
            />
            Reservas inteligentes para hostelería
          </span>
          <h1
            className="font-display mt-6 text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl"
            style={{ color: "var(--ink)" }}
          >
            Convierte cada visita en una{" "}
            <span className="brand-gradient-text">reserva directa</span>.
          </h1>
          <p
            className="mx-auto mt-5 max-w-2xl text-lg"
            style={{ color: "var(--muted)" }}
          >
            Motor de disponibilidad anti-overbooking, widget embebible para tu
            web y un panel de operaciones que tu equipo entiende a la primera.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/signup">Empezar gratis</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/book/la-trattoria">Ver widget demo</Link>
            </Button>
          </div>
        </section>

        <section
          className="animate-rise mx-auto mt-16 grid max-w-4xl gap-4 sm:grid-cols-3"
          style={{ animationDelay: "120ms" }}
        >
          {stats.map((s) => (
            <div
              key={s.label}
              className="shadow-soft rounded-2xl px-6 py-5 text-center"
              style={{
                backgroundColor: "var(--surface)",
                border: "1px solid var(--line)",
              }}
            >
              <p
                className="font-display text-3xl font-semibold"
                style={{ color: "var(--ink)" }}
              >
                {s.value}
              </p>
              <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                {s.label}
              </p>
            </div>
          ))}
        </section>

        <section
          className="animate-rise mt-12 grid gap-4 md:grid-cols-3"
          style={{ animationDelay: "200ms" }}
        >
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl px-6 py-6"
              style={{
                backgroundColor: "var(--surface)",
                border: "1px solid var(--line)",
              }}
            >
              <h3
                className="font-display text-lg font-semibold"
                style={{ color: "var(--ink)" }}
              >
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                {f.desc}
              </p>
            </div>
          ))}
        </section>

        <section
          className="brand-gradient animate-rise shadow-soft mt-14 overflow-hidden rounded-3xl px-8 py-12 text-center"
          style={{ animationDelay: "280ms" }}
        >
          <h2 className="font-display text-3xl font-semibold text-white">
            ¿List@ para no perder ni una reserva?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base" style={{ color: "rgba(255,255,255,0.8)" }}>
            Crea tu cuenta y empieza a recibir reservas directas hoy mismo.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/signup">Crear cuenta</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/40 bg-white/10 text-white hover:border-white hover:text-white"
            >
              <Link href="/login">Acceder al panel</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
