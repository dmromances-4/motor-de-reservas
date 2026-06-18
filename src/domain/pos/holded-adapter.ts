import type { PosAdapter, PosCredentials, PosReservationPayload } from "./adapter";

export function createHoldedAdapter(credentials: PosCredentials): PosAdapter {
  const apiKey = credentials.apiKey ?? process.env.HOLDED_API_KEY;

  return {
    provider: "HOLDED",

    async testConnection() {
      if (!apiKey) return false;
      const res = await fetch("https://api.holded.com/api/invoicing/v1/contacts", {
        headers: { key: apiKey },
      });
      return res.ok;
    },

    async pushCompletedReservation(reservation: PosReservationPayload) {
      if (!apiKey) {
        return `holded-dev-${reservation.id}`;
      }

      const contactName = `${reservation.guest.firstName} ${reservation.guest.lastName ?? ""}`.trim();
      let contactId: string | undefined;

      const searchRes = await fetch(
        `https://api.holded.com/api/invoicing/v1/contacts?name=${encodeURIComponent(contactName)}`,
        { headers: { key: apiKey } },
      );
      if (searchRes.ok) {
        const contacts = (await searchRes.json()) as Array<{ id: string }>;
        contactId = contacts[0]?.id;
      }

      if (!contactId) {
        const createRes = await fetch(
          "https://api.holded.com/api/invoicing/v1/contacts",
          {
            method: "POST",
            headers: { key: apiKey, "Content-Type": "application/json" },
            body: JSON.stringify({
              name: contactName,
              email: reservation.guest.email,
              phone: reservation.guest.phone,
            }),
          },
        );
        if (!createRes.ok) throw new Error(await createRes.text());
        const created = (await createRes.json()) as { id: string };
        contactId = created.id;
      }

      const invoiceRes = await fetch(
        "https://api.holded.com/api/invoicing/v1/documents/invoice",
        {
          method: "POST",
          headers: { key: apiKey, "Content-Type": "application/json" },
          body: JSON.stringify({
            contactId,
            desc: `Reserva ${reservation.id} · ${reservation.partySize} pax`,
            date: Math.floor(reservation.dateTime.getTime() / 1000),
            items: [
              {
                name: `Servicio ${reservation.venue.name}`,
                units: 1,
                subtotal: reservation.partySize * 25,
              },
            ],
          }),
        },
      );

      if (!invoiceRes.ok) throw new Error(await invoiceRes.text());
      const invoice = (await invoiceRes.json()) as { id: string };
      return invoice.id;
    },
  };
}
