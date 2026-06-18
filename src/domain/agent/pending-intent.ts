import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export type PendingIntent = {
  partySize?: number;
  date?: string;
  time?: string;
  preferredDateTime?: string;
  serviceId?: string;
};

export function extractPendingIntentFromTool(
  toolName: string,
  input: unknown,
): Partial<PendingIntent> {
  if (!input || typeof input !== "object") return {};
  const data = input as Record<string, unknown>;

  switch (toolName) {
    case "availability.check":
      return {
        partySize: data.partySize as number | undefined,
        date: data.date as string | undefined,
      };
    case "availability.suggestAlternatives":
      if (typeof data.preferredDateTime === "string") {
        const dt = data.preferredDateTime;
        return {
          partySize: data.partySize as number | undefined,
          preferredDateTime: dt,
          date: dt.slice(0, 10),
          time: dt.slice(11, 16),
        };
      }
      return { partySize: data.partySize as number | undefined };
    case "reservation.create":
      if (typeof data.dateTime === "string") {
        const dt = data.dateTime;
        return {
          partySize: data.partySize as number | undefined,
          preferredDateTime: dt,
          date: dt.slice(0, 10),
          time: dt.slice(11, 16),
          serviceId: data.serviceId as string | undefined,
        };
      }
      return {
        partySize: data.partySize as number | undefined,
        serviceId: data.serviceId as string | undefined,
      };
    default:
      return {};
  }
}

export async function mergePendingIntent(
  conversationId: string,
  patch: Partial<PendingIntent>,
) {
  const conversation = await prisma.agentConversation.findUnique({
    where: { id: conversationId },
    select: { metadata: true },
  });
  if (!conversation) return;

  const current =
    (conversation.metadata as PendingIntent | null | undefined) ?? {};

  const next: PendingIntent = {
    ...current,
    ...Object.fromEntries(
      Object.entries(patch).filter(([, v]) => v !== undefined),
    ),
  };

  await prisma.agentConversation.update({
    where: { id: conversationId },
    data: { metadata: next as Prisma.InputJsonValue },
  });
}
