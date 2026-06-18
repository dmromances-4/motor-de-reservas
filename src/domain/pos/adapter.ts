import type { PosProvider } from "@/generated/prisma/client";

export type PosReservationPayload = {
  id: string;
  partySize: number;
  dateTime: Date;
  notes: string | null;
  guest: {
    firstName: string;
    lastName: string | null;
    email: string | null;
    phone: string | null;
  };
  venue: { name: string; currency: string };
};

export interface PosAdapter {
  provider: PosProvider;
  testConnection(): Promise<boolean>;
  pushCompletedReservation(
    reservation: PosReservationPayload,
  ): Promise<string>;
  syncCatalog?(): Promise<void>;
}

export type PosCredentials = {
  accessToken?: string;
  apiKey?: string;
  locationId?: string;
};
