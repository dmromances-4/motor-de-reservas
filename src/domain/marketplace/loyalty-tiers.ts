export type LoyaltyTier = {
  id: string;
  name: string;
  minPoints: number;
  platformDiscountBps: number;
  perks: string[];
};

export const LOYALTY_TIERS: LoyaltyTier[] = [
  {
    id: "bronze",
    name: "Bronce",
    minPoints: 0,
    platformDiscountBps: 0,
    perks: ["Acumula puntos en cada visita"],
  },
  {
    id: "silver",
    name: "Plata",
    minPoints: 300,
    platformDiscountBps: 200,
    perks: ["2% descuento plataforma", "Prioridad en lista de espera"],
  },
  {
    id: "gold",
    name: "Oro",
    minPoints: 800,
    platformDiscountBps: 500,
    perks: ["5% descuento plataforma", "Acceso anticipado a promos"],
  },
];

export function tierForPoints(points: number): LoyaltyTier {
  return (
    [...LOYALTY_TIERS].reverse().find((t) => points >= t.minPoints) ??
    LOYALTY_TIERS[0]
  );
}

export function platformDiscountBps(points: number): number {
  return tierForPoints(points).platformDiscountBps;
}
