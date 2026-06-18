export type TimeRange = {
  start: Date;
  end: Date;
};

export type ExistingReservation = {
  dateTime: Date;
  partySize: number;
  durationMinutes: number;
  status: string;
  tableIds?: string[];
};

export type AvailabilityBlock = {
  startTime: Date;
  endTime: Date;
};

export type ServiceScheduleDay = {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isActive: boolean;
};

export type TableInfo = {
  id: string;
  minCapacity: number;
  maxCapacity: number;
  status: string;
};

export type VenueAvailabilityConfig = {
  timezone: string;
  capacityMode: "simple" | "tables";
  totalCapacity: number;
  slotIntervalMinutes: number;
  bufferMinutes: number;
  maxPartySize: number;
};

export type ServiceConfig = {
  id: string;
  durationMinutes: number;
  schedules: ServiceScheduleDay[];
};

export type AvailabilityInput = {
  date: string;
  partySize: number;
  venue: VenueAvailabilityConfig;
  service: ServiceConfig;
  existingReservations: ExistingReservation[];
  blocks: AvailabilityBlock[];
  tables?: TableInfo[];
  isClosed?: boolean;
};

export type AvailabilitySlot = {
  dateTime: string;
  serviceId: string;
  availableCapacity: number;
  tableIds?: string[];
};
