"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  Coins,
  LayoutDashboard,
  LayoutGrid,
  Megaphone,
  Plug,
  Settings,
  Tag,
  Users,
  UserCircle,
  Utensils,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Wordmark } from "@/components/ui/wordmark";

type NavLink = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
};

const sections: { title: string; links: NavLink[] }[] = [
  {
    title: "Operación",
    links: [
      { href: "/dashboard", label: "Resumen", icon: LayoutDashboard },
      { href: "/dashboard/reservations", label: "Reservas", icon: Calendar },
      { href: "/dashboard/host", label: "Host View", icon: Utensils },
      { href: "/dashboard/floor-plan", label: "Mapa de sala", icon: LayoutGrid },
    ],
  },
  {
    title: "Clientes",
    links: [
      { href: "/dashboard/guests", label: "Comensales", icon: Users },
      { href: "/dashboard/segments", label: "Segmentos", icon: UserCircle },
    ],
  },
  {
    title: "Crecimiento",
    links: [
      { href: "/dashboard/campaigns", label: "Campañas", icon: Megaphone },
      { href: "/dashboard/promos", label: "Descuentos", icon: Tag },
      { href: "/dashboard/integrations", label: "Integraciones", icon: Plug },
    ],
  },
  {
    title: "Cuenta",
    links: [
      { href: "/dashboard/commissions", label: "Comisiones", icon: Coins },
      { href: "/dashboard/settings", label: "Ajustes", icon: Settings },
    ],
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="flex w-72 flex-col justify-between px-5 py-7"
      style={{ backgroundColor: "var(--ink)", color: "#dfe2f2" }}
    >
      <div>
        <div className="mb-9 px-3">
          <Wordmark tone="light" />
          <p
            className="mt-2 text-[0.62rem] font-semibold uppercase tracking-[0.28em]"
            style={{ color: "rgba(223, 226, 242, 0.4)" }}
          >
            Panel de control
          </p>
        </div>

        <nav className="space-y-7">
          {sections.map((section) => (
            <div key={section.title}>
              <p
                className="px-3 pb-2 text-[0.6rem] font-semibold uppercase tracking-[0.26em]"
                style={{ color: "rgba(223, 226, 242, 0.38)" }}
              >
                {section.title}
              </p>
              <div className="space-y-0.5">
                {section.links.map((link) => {
                  const Icon = link.icon;
                  const active =
                    pathname === link.href ||
                    (link.href !== "/dashboard" &&
                      pathname.startsWith(link.href));
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200"
                      style={
                        active
                          ? {
                              backgroundColor: "rgba(60, 204, 190, 0.14)",
                              color: "#ffffff",
                            }
                          : { color: "rgba(223, 226, 242, 0.7)" }
                      }
                    >
                      <span
                        className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full transition-all duration-200"
                        style={{
                          backgroundColor: active ? "var(--teal)" : "transparent",
                        }}
                      />
                      <Icon
                        className="h-[1.05rem] w-[1.05rem] shrink-0 transition-colors"
                        style={{
                          color: active
                            ? "var(--teal)"
                            : "rgba(223, 226, 242, 0.55)",
                        }}
                      />
                      <span
                        className={cn(active ? "font-semibold" : "font-medium")}
                      >
                        {link.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      <div
        className="mt-8 rounded-2xl px-4 py-4"
        style={{
          backgroundColor: "rgba(223, 226, 242, 0.05)",
          border: "1px solid rgba(223, 226, 242, 0.08)",
        }}
      >
        <p
          className="font-display text-sm font-semibold"
          style={{ color: "#ffffff" }}
        >
          Cada llamada, una reserva.
        </p>
        <p
          className="mt-1 text-xs leading-relaxed"
          style={{ color: "rgba(223, 226, 242, 0.5)" }}
        >
          Gestiona reservas, sala y clientes desde un único lugar.
        </p>
      </div>
    </aside>
  );
}
