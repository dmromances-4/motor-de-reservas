export type AgentChannel = "web" | "whatsapp" | "instagram" | "phone" | "internal";

export type AgentToolContext = {
  venueId: string;
  venueSlug: string;
  conversationId?: string;
  channel: AgentChannel;
  agentTableOptimizationEnabled?: boolean;
  depositRequired?: boolean;
};

export type AvailabilityCheckInput = {
  date: string;
  partySize: number;
  serviceId?: string;
};

export type AvailabilitySlot = {
  startTime: string;
  endTime: string;
  serviceId: string;
  serviceName: string;
  available: boolean;
};

export type AvailabilityCheckOutput = {
  venueName: string;
  date: string;
  partySize: number;
  slots: AvailabilitySlot[];
  message: string;
};

export type ToolExecutionResult<T> = {
  success: boolean;
  output?: T;
  error?: string;
  latencyMs: number;
};
