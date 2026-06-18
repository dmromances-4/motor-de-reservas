import type { ReservationSource } from "@/generated/prisma/client";

export type ReservationStatRow = {
  dateTime: Date;
  partySize: number;
  source: ReservationSource;
};

export type PeriodStats = {
  reservations: number;
  covers: number;
};

export type ChannelPeriodStats = {
  currentMonth: PeriodStats;
  previousMonth: PeriodStats;
  yearToDate: PeriodStats;
};

export type ChannelStatsMap = Partial<
  Record<ReservationSource, ChannelPeriodStats>
>;

function isInMonth(date: Date, year: number, month: number): boolean {
  return date.getFullYear() === year && date.getMonth() === month;
}

export function aggregateChannelStats(
  rows: ReservationStatRow[],
  now = new Date(),
): ChannelStatsMap {
  const year = now.getFullYear();
  const month = now.getMonth();
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;

  const result: ChannelStatsMap = {};

  for (const row of rows) {
    const source = row.source;
    if (!result[source]) {
      result[source] = {
        currentMonth: { reservations: 0, covers: 0 },
        previousMonth: { reservations: 0, covers: 0 },
        yearToDate: { reservations: 0, covers: 0 },
      };
    }

    const stats = result[source]!;
    if (isInMonth(row.dateTime, year, month)) {
      stats.currentMonth.reservations += 1;
      stats.currentMonth.covers += row.partySize;
    }
    if (isInMonth(row.dateTime, prevYear, prevMonth)) {
      stats.previousMonth.reservations += 1;
      stats.previousMonth.covers += row.partySize;
    }
    if (row.dateTime.getFullYear() === year) {
      stats.yearToDate.reservations += 1;
      stats.yearToDate.covers += row.partySize;
    }
  }

  return result;
}

export function emptyChannelStats(): ChannelPeriodStats {
  const empty = { reservations: 0, covers: 0 };
  return {
    currentMonth: { ...empty },
    previousMonth: { ...empty },
    yearToDate: { ...empty },
  };
}

export function getStatsForIntegration(
  statsKey: ReservationSource | undefined,
  statsMap: ChannelStatsMap,
): ChannelPeriodStats | null {
  if (!statsKey) return null;
  return statsMap[statsKey] ?? {
    currentMonth: { reservations: 0, covers: 0 },
    previousMonth: { reservations: 0, covers: 0 },
    yearToDate: { reservations: 0, covers: 0 },
  };
}

export function getChannelSummary(statsMap: ChannelStatsMap): PeriodStats {
  let reservations = 0;
  let covers = 0;
  for (const channel of Object.values(statsMap)) {
    reservations += channel.currentMonth.reservations;
    covers += channel.currentMonth.covers;
  }
  return { reservations, covers };
}
