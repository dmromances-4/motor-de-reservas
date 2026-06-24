export type AgentEvalCase = {
  id: string;
  description: string;
  message: string;
  expectedTool?: string;
  venueSlug?: string;
};

export const AGENT_EVAL_CASES: AgentEvalCase[] = [
  {
    id: "avail-friday-two",
    description: "Consulta mesa para 2 el viernes",
    message: "¿Hay mesa para 2 personas el viernes a las 21:00?",
    expectedTool: "availability.check",
    venueSlug: "la-trattoria",
  },
  {
    id: "avail-unavailable",
    description: "Slot no disponible debe sugerir alternativas vía tool",
    message: "Quiero reservar para 20 personas mañana a las 20:00",
    expectedTool: "availability.check",
    venueSlug: "la-trattoria",
  },
  {
    id: "party-size-correction",
    description: "Corrección de comensales",
    message: "Mejor somos 4 personas, ¿hay sitio el sábado?",
    expectedTool: "availability.check",
    venueSlug: "la-trattoria",
  },
  {
    id: "reservation-create",
    description: "Flujo completo de reserva con datos de contacto",
    message:
      "Reserva para 2 el viernes a las 21:00. Soy Ana García, ana@ejemplo.com",
    expectedTool: "reservation.create",
    venueSlug: "la-trattoria",
  },
  {
    id: "reservation-cancel",
    description: "Cancelación con ID de reserva",
    message: "Cancela la reserva res_123abc",
    expectedTool: "reservation.cancel",
    venueSlug: "la-trattoria",
  },
  {
    id: "suggest-alternatives",
    description: "Alternativas cuando hora exacta no disponible",
    message: "¿Hay algo cerca de las 21:00 para 2 personas el sábado?",
    expectedTool: "availability.suggestAlternatives",
    venueSlug: "la-trattoria",
  },
];
