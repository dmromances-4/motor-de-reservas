import { addMinutes, parseISO, startOfDay } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import type {
  AvailabilityBlock,
  AvailabilityInput,
  AvailabilitySlot,
  ExistingReservation,
  TimeRange,
} from "./types";

const ACTIVE_STATUSES = new Set(["PENDING", "CONFIRMED", "SEATED"]);

export function parseTimeOnDate(
  dateStr: string,
  timeStr: string,
  timezone: string,
): Date {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const [year, month, day] = dateStr.split("-").map(Number);
  const local = new Date(year, month - 1, day, hours, minutes, 0, 0);
  return fromZonedTime(local, timezone);
}

export function getReservationRange(
  dateTime: Date,
  durationMinutes: number,
  bufferMinutes: number,
): TimeRange {
  return {
    start: dateTime,
    end: addMinutes(dateTime, durationMinutes + bufferMinutes),
  };
}

export function rangesOverlap(a: TimeRange, b: TimeRange): boolean {
  return a.start < b.end && b.start < a.end;
}

export function getOccupancyAtSlot(
  slotStart: Date,
  slotEnd: Date,
  reservations: ExistingReservation[],
  bufferMinutes: number,
): number {
  let occupancy = 0;
  for (const reservation of reservations) {
    if (!ACTIVE_STATUSES.has(reservation.status)) continue;
    const range = getReservationRange(
      reservation.dateTime,
      reservation.durationMinutes,
      bufferMinutes,
    );
    if (rangesOverlap({ start: slotStart, end: slotEnd }, range)) {
      occupancy += reservation.partySize;
    }
  }
  return occupancy;
}

export function isBlocked(
  slotStart: Date,
  slotEnd: Date,
  blocks: AvailabilityBlock[],
): boolean {
  return blocks.some((block) =>
    rangesOverlap({ start: slotStart, end: slotEnd }, {
      start: block.startTime,
      end: block.endTime,
    }),
  );
}

export function findAvailableTables(
  slotStart: Date,
  slotEnd: Date,
  partySize: number,
  reservations: ExistingReservation[],
  tables: NonNullable<AvailabilityInput["tables"]>,
  bufferMinutes: number,
): string[] | null {
  const reservedTableIds = new Set<string>();

  for (const reservation of reservations) {
    if (!ACTIVE_STATUSES.has(reservation.status)) continue;
    const range = getReservationRange(
      reservation.dateTime,
      reservation.durationMinutes,
      bufferMinutes,
    );
    if (!rangesOverlap({ start: slotStart, end: slotEnd }, range)) continue;
    reservation.tableIds?.forEach((id) => reservedTableIds.add(id));
  }

  const available = tables.filter(
    (table) =>
      table.status !== "BLOCKED" &&
      table.minCapacity <= partySize &&
      table.maxCapacity >= partySize &&
      !reservedTableIds.has(table.id),
  );

  if (available.length === 0) return null;
  return [available[0].id];
}

/** All single tables that fit partySize and are free for the slot (for agent optimizer). */
export function listAvailableTablesForSlot(
  slotStart: Date,
  slotEnd: Date,
  partySize: number,
  reservations: ExistingReservation[],
  tables: NonNullable<AvailabilityInput["tables"]>,
  bufferMinutes: number,
): NonNullable<AvailabilityInput["tables"]> {
  const reservedTableIds = new Set<string>();

  for (const reservation of reservations) {
    if (!ACTIVE_STATUSES.has(reservation.status)) continue;
    const range = getReservationRange(
      reservation.dateTime,
      reservation.durationMinutes,
      bufferMinutes,
    );
    if (!rangesOverlap({ start: slotStart, end: slotEnd }, range)) continue;
    reservation.tableIds?.forEach((id) => reservedTableIds.add(id));
  }

  return tables.filter(
    (table) =>
      table.status !== "BLOCKED" &&
      table.minCapacity <= partySize &&
      table.maxCapacity >= partySize &&
      !reservedTableIds.has(table.id),
  );
}

export function calculateSlots(input: AvailabilityInput): AvailabilitySlot[] {
  const {
    date,
    partySize,
    venue,
    service,
    existingReservations,
    blocks,
    tables,
    isClosed,
  } = input;

  if (isClosed) return [];
  if (partySize > venue.maxPartySize || partySize < 1) return [];

  const dayOfWeek = toZonedTime(parseISO(`${date}T12:00:00`), venue.timezone).getDay();
  const schedule = service.schedules.find(
    (s) => s.dayOfWeek === dayOfWeek && s.isActive,
  );

  if (!schedule) return [];

  const openAt = parseTimeOnDate(date, schedule.openTime, venue.timezone);
  const closeAt = parseTimeOnDate(date, schedule.closeTime, venue.timezone);
  const lastSlotStart = addMinutes(closeAt, -service.durationMinutes);

  const slots: AvailabilitySlot[] = [];
  let cursor = openAt;

  while (cursor <= lastSlotStart) {
    const slotEnd = addMinutes(cursor, service.durationMinutes);
    const checkEnd = addMinutes(slotEnd, venue.bufferMinutes);

    if (!isBlocked(cursor, checkEnd, blocks)) {
      if (venue.capacityMode === "tables" && tables?.length) {
        const tableIds = findAvailableTables(
          cursor,
          checkEnd,
          partySize,
          existingReservations,
          tables,
          venue.bufferMinutes,
        );
        if (tableIds) {
          slots.push({
            dateTime: cursor.toISOString(),
            serviceId: service.id,
            availableCapacity: partySize,
            tableIds,
          });
        }
      } else {
        const occupancy = getOccupancyAtSlot(
          cursor,
          checkEnd,
          existingReservations,
          venue.bufferMinutes,
        );
        const remaining = venue.totalCapacity - occupancy;
        if (remaining >= partySize) {
          slots.push({
            dateTime: cursor.toISOString(),
            serviceId: service.id,
            availableCapacity: remaining,
          });
        }
      }
    }

    cursor = addMinutes(cursor, venue.slotIntervalMinutes);
  }

  return slots;
}

export function validateSlotAvailable(
  input: AvailabilityInput,
  dateTime: string,
): boolean {
  const slots = calculateSlots(input);
  return slots.some((slot) => slot.dateTime === dateTime);
}

export function getDayBounds(date: string, timezone: string): TimeRange {
  const start = fromZonedTime(startOfDay(parseISO(`${date}T00:00:00`)), timezone);
  const end = addMinutes(start, 24 * 60);
  return { start, end };
}
