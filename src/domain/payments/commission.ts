export function calculateCommission(
  depositAmountCents: number,
  commissionBps: number,
): number {
  return Math.round((depositAmountCents * commissionBps) / 10000);
}
