import type { PosAdapter, PosCredentials, PosReservationPayload } from "./adapter";

export function createSquareAdapter(credentials: PosCredentials): PosAdapter {
  const accessToken = credentials.accessToken ?? process.env.SQUARE_ACCESS_TOKEN;
  const locationId =
    credentials.locationId ?? process.env.SQUARE_LOCATION_ID;

  return {
    provider: "SQUARE",

    async testConnection() {
      if (!accessToken) return false;
      const res = await fetch("https://connect.squareup.com/v2/locations", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Square-Version": "2024-12-18",
        },
      });
      return res.ok;
    },

    async pushCompletedReservation(reservation: PosReservationPayload) {
      if (!accessToken || !locationId) {
        return `square-dev-${reservation.id}`;
      }

      const res = await fetch("https://connect.squareup.com/v2/orders", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "Square-Version": "2024-12-18",
        },
        body: JSON.stringify({
          order: {
            location_id: locationId,
            reference_id: reservation.id,
            line_items: [
              {
                name: `Reserva ${reservation.guest.firstName}`,
                quantity: String(reservation.partySize),
                note: reservation.notes ?? undefined,
              },
            ],
          },
          idempotency_key: reservation.id,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }

      const data = (await res.json()) as { order: { id: string } };
      return data.order.id;
    },

    async syncCatalog() {
      // MVP: no-op; Square catalog sync in future phase
    },
  };
}
