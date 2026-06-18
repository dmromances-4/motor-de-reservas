import { redirect } from "next/navigation";
import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { Button } from "@/components/ui/button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const membership = session.user.memberships[0];

  const initials = (membership?.venueName ?? "··")
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      <DashboardSidebar />
      <div className="flex flex-1 flex-col">
        <header
          className="sticky top-0 z-10 flex items-center justify-between px-8 py-4"
          style={{
            borderBottom: "1px solid var(--line)",
            backgroundColor: "rgba(246, 248, 255, 0.82)",
            backdropFilter: "blur(10px)",
          }}
        >
          <div className="flex items-center gap-3.5">
            <span
              className="font-display flex h-11 w-11 items-center justify-center rounded-xl text-base font-semibold"
              style={{
                backgroundColor: "var(--teal-soft)",
                color: "var(--teal-deep)",
                border: "1px solid var(--line)",
              }}
            >
              {initials || "··"}
            </span>
            <div>
              <p
                className="text-[0.62rem] font-semibold uppercase tracking-[0.2em]"
                style={{ color: "var(--muted-2)" }}
              >
                Local activo
              </p>
              <p
                className="font-display text-lg font-semibold leading-tight"
                style={{ color: "var(--ink)" }}
              >
                {membership?.venueName ?? "Sin local"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {membership && (
              <Button asChild size="sm" variant="outline">
                <Link href={`/book/${membership.venueSlug}`} target="_blank">
                  Ver widget
                </Link>
              </Button>
            )}
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <Button size="sm" type="submit" variant="ghost">
                Salir
              </Button>
            </form>
          </div>
        </header>
        <main className="flex-1 px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
