import { createAvailabilityCheckTool } from "@/domain/agent/tools/availability";
import { createSuggestAlternativesTool } from "@/domain/agent/tools/suggest-alternatives";
import { createTableOptimizeTool } from "@/domain/agent/tools/table-optimize";
import {
  createReservationCancelTool,
  createReservationCreateTool,
  createReservationModifyTool,
} from "@/domain/agent/tools/reservation";
import type { AgentToolContext } from "@/domain/agent/types";

export function createAgentTools(ctx: AgentToolContext) {
  return {
    "availability.check": createAvailabilityCheckTool(ctx),
    "availability.suggestAlternatives": createSuggestAlternativesTool(ctx),
    "table.optimizeAssignment": createTableOptimizeTool(ctx),
    "reservation.create": createReservationCreateTool(ctx),
    "reservation.modify": createReservationModifyTool(ctx),
    "reservation.cancel": createReservationCancelTool(ctx),
  } as const;
}

export type AgentTools = ReturnType<typeof createAgentTools>;

export { executeAvailabilityCheck, availabilityInputSchema } from "./availability";
export {
  executeSuggestAlternatives,
  suggestAlternativesSchema,
} from "./suggest-alternatives";
export { executeTableOptimize, tableOptimizeSchema } from "./table-optimize";
export {
  executeReservationCreate,
  executeReservationModify,
  executeReservationCancel,
} from "./reservation";
