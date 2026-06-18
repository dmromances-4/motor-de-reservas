import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/account/login");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Hola, {session.user.name}</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-zinc-500">Puntos Yums</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{session.user.loyaltyPoints}</p>
            <Link href="/account/loyalty" className="text-sm text-zinc-600 hover:underline">
              Ver detalle
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-zinc-500">Reservas</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/account/reservations" className="text-sm font-medium hover:underline">
              Ver historial →
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-zinc-500">Favoritos</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/account/favorites" className="text-sm font-medium hover:underline">
              Mis locales favoritos →
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
