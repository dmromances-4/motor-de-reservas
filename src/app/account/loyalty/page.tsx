import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTierForUser } from "@/domain/marketplace/loyalty-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoyaltyRedeemForm } from "@/components/account/loyalty-redeem-form";

export default async function AccountLoyaltyPage() {
  const session = await auth();
  if (!session?.user) redirect("/account/login");
  if (session.user.accountType !== "DINER") redirect("/dashboard");

  const [completedMarketplace, rewards, redemptions, transactions] =
    await Promise.all([
      prisma.reservation.count({
        where: {
          dinerUserId: session.user.id,
          source: "MARKETPLACE",
          status: "COMPLETED",
          loyaltyPointsAwarded: true,
        },
      }),
      prisma.reward.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.rewardRedemption.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { reward: true },
      }),
      prisma.loyaltyTransaction.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

  const tier = getTierForUser(session.user.loyaltyPoints ?? 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Programa de puntos</h1>

      <Card>
        <CardHeader>
          <CardTitle>
            Nivel {tier.name} · {session.user.loyaltyPoints} puntos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <ul className="list-inside list-disc text-sm text-zinc-600">
            {tier.perks.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <p className="text-sm text-zinc-500">
            Visitas completadas en marketplace: {completedMarketplace}
          </p>
          {session.user.referralCode && (
            <p className="text-sm text-zinc-600">
              Tu código de referido:{" "}
              <span className="font-mono font-semibold">
                {session.user.referralCode}
              </span>
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Canjear recompensas</CardTitle>
        </CardHeader>
        <CardContent>
          <LoyaltyRedeemForm rewards={rewards} points={session.user.loyaltyPoints ?? 0} />
        </CardContent>
      </Card>

      {redemptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Canjes recientes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {redemptions.map((r) => (
              <div key={r.id} className="flex justify-between border-b py-2">
                <span>{r.reward.name}</span>
                <span className="font-mono text-xs">{r.code}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {transactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historial de puntos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {transactions.map((t) => (
              <div key={t.id} className="flex justify-between border-b py-2">
                <span>{t.reason}</span>
                <span className={t.points >= 0 ? "text-emerald-700" : "text-red-600"}>
                  {t.points >= 0 ? "+" : ""}
                  {t.points}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
