import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { formatDate, formatTime } from "@/lib/utils";
import type { NotificationType } from "@/generated/prisma/client";

type ReservationWithRelations = {
  id: string;
  venueId: string;
  dateTime: Date;
  partySize: number;
  confirmationCode: string;
  guest: { firstName: string; email: string | null };
  service: { name: string };
  venue: { name: string; timezone: string };
};

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

function buildEmail(
  type: NotificationType,
  reservation: ReservationWithRelations,
): { subject: string; html: string } {
  const name = reservation.guest.firstName;
  const venueName = reservation.venue.name;
  const when = `${formatDate(reservation.dateTime, reservation.venue.timezone)} a las ${formatTime(reservation.dateTime, reservation.venue.timezone)}`;
  const code = reservation.confirmationCode;

  switch (type) {
    case "CONFIRMATION":
      return {
        subject: `Reserva confirmada en ${venueName}`,
        html: `<p>Hola ${name},</p><p>Tu reserva en <strong>${venueName}</strong> está confirmada.</p><p><strong>Fecha:</strong> ${when}<br/><strong>Comensales:</strong> ${reservation.partySize}<br/><strong>Servicio:</strong> ${reservation.service.name}<br/><strong>Código:</strong> ${code}</p>`,
      };
    case "REMINDER_24H":
      return {
        subject: `Recordatorio: reserva mañana en ${venueName}`,
        html: `<p>Hola ${name},</p><p>Te recordamos tu reserva mañana en <strong>${venueName}</strong> (${when}, ${reservation.partySize} comensales).</p>`,
      };
    case "REMINDER_2H":
      return {
        subject: `Tu reserva en ${venueName} es en 2 horas`,
        html: `<p>Hola ${name},</p><p>Tu mesa en <strong>${venueName}</strong> te espera hoy a las ${formatTime(reservation.dateTime, reservation.venue.timezone)}.</p>`,
      };
    case "CANCELLATION":
      return {
        subject: `Reserva cancelada en ${venueName}`,
        html: `<p>Hola ${name},</p><p>Tu reserva en <strong>${venueName}</strong> del ${when} ha sido cancelada.</p>`,
      };
    default:
      return {
        subject: `Actualización de reserva en ${venueName}`,
        html: `<p>Hola ${name},</p><p>Hay una actualización sobre tu reserva en ${venueName}.</p>`,
      };
  }
}

export async function sendReservationNotification(
  reservation: ReservationWithRelations,
  type: NotificationType,
) {
  const email = reservation.guest.email;
  if (!email) return null;

  const { subject, html } = buildEmail(type, reservation);

  const log = await prisma.notificationLog.create({
    data: {
      venueId: reservation.venueId,
      reservationId: reservation.id,
      type,
      recipient: email,
      status: "PENDING",
    },
  });

  try {
    if (resend && process.env.EMAIL_FROM) {
      await resend.emails.send({
        from: process.env.EMAIL_FROM,
        to: email,
        subject,
        html,
      });
    } else if (process.env.NODE_ENV === "development") {
      console.log(`[EMAIL ${type}] To: ${email}\nSubject: ${subject}\n${html}`);
    }

    return prisma.notificationLog.update({
      where: { id: log.id },
      data: { status: "SENT", sentAt: new Date() },
    });
  } catch (error) {
    return prisma.notificationLog.update({
      where: { id: log.id },
      data: {
        status: "FAILED",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
}

export async function processPendingReminders() {
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in2h = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const windowMs = 15 * 60 * 1000;

  const reservations24 = await prisma.reservation.findMany({
    where: {
      status: { in: ["CONFIRMED", "PENDING"] },
      dateTime: {
        gte: new Date(in24h.getTime() - windowMs),
        lte: new Date(in24h.getTime() + windowMs),
      },
      notificationLogs: { none: { type: "REMINDER_24H", status: "SENT" } },
    },
    include: { guest: true, service: true, venue: true },
  });

  const reservations2 = await prisma.reservation.findMany({
    where: {
      status: { in: ["CONFIRMED", "PENDING"] },
      dateTime: {
        gte: new Date(in2h.getTime() - windowMs),
        lte: new Date(in2h.getTime() + windowMs),
      },
      notificationLogs: { none: { type: "REMINDER_2H", status: "SENT" } },
    },
    include: { guest: true, service: true, venue: true },
  });

  for (const r of reservations24) {
    await sendReservationNotification(r, "REMINDER_24H");
  }
  for (const r of reservations2) {
    await sendReservationNotification(r, "REMINDER_2H");
  }

  return { sent24h: reservations24.length, sent2h: reservations2.length };
}
