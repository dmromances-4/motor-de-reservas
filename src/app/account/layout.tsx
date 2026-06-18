import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (
    session?.user?.accountType &&
    session.user.accountType !== "DINER"
  ) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/explore" className="font-semibold">
            Motor de Reservas
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/explore">Explorar</Link>
            {session?.user ? (
              <>
                <Link href="/account">Mi cuenta</Link>
                <Link href="/account/reservations">Reservas</Link>
                <Link href="/account/favorites">Favoritos</Link>
                <Link href="/account/loyalty">Puntos</Link>
                <form
                  action={async () => {
                    "use server";
                    const { signOut } = await import("@/lib/auth");
                    await signOut({ redirectTo: "/explore" });
                  }}
                >
                  <Button variant="ghost" size="sm" type="submit">
                    Salir
                  </Button>
                </form>
              </>
            ) : (
              <>
                <Link href="/account/login">Entrar</Link>
                <Button asChild size="sm">
                  <Link href="/account/signup">Registrarse</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
