import type { ReservationSource } from "@/generated/prisma/client";

export type IntegrationCategory =
  | "social"
  | "booking_channels"
  | "external_channels"
  | "phone_assistants"
  | "marketplace"
  | "marketing"
  | "tpv"
  | "host_assistants"
  | "analytics"
  | "order_management";

export type IntegrationProfileField =
  | "instagramUrl"
  | "tripAdvisorUrl"
  | "theForkUrl"
  | "tiktokUrl"
  | "isListedOnMarketplace";

export type IntegrationSettingsTab = "links" | "operation";

export type IntegrationDefinition = {
  slug: string;
  name: string;
  category: IntegrationCategory;
  description: string;
  color: string;
  connectable?: boolean;
  posProvider?: "SQUARE" | "HOLDED";
  statsKey?: ReservationSource;
  profileField?: IntegrationProfileField;
  settingsTab?: IntegrationSettingsTab;
  showStats?: boolean;
  shareType?: "widget" | "marketplace";
  logoPath?: string;
  href?: string;
  envCheck?: "resend" | "twilio";
  alwaysAvailable?: boolean;
  connectionProvider?: string;
};

export const INTEGRATION_CATEGORIES: Record<
  IntegrationCategory,
  { title: string; description?: string }
> = {
  social: {
    title: "Redes sociales",
    description: "Perfiles y presencia en redes conectados a tu local.",
  },
  booking_channels: {
    title: "Canales de reservas",
    description: "Botones y reservas directas desde plataformas externas.",
  },
  external_channels: {
    title: "Canales externos",
    description:
      "Consulta reservas y comensales recibidos en cada canal de distribución.",
  },
  phone_assistants: {
    title: "Asistentes telefónicos",
    description: "IA y centralitas para automatizar reservas por teléfono.",
  },
  marketplace: {
    title: "Marketplace",
    description: "Plataformas de descubrimiento y reserva premium.",
  },
  marketing: {
    title: "Marketing",
    description: "Campañas y comunicación multicanal con tus comensales.",
  },
  tpv: {
    title: "TPVs",
    description: "Sincroniza tickets y facturación con tu punto de venta.",
  },
  host_assistants: {
    title: "Asistentes de sala",
    description: "Herramientas para optimizar el servicio en sala.",
  },
  analytics: {
    title: "Analítica de datos",
    description: "Integración de datos y reporting avanzado.",
  },
  order_management: {
    title: "Gestión de pedidos",
    description: "Pedidos online y delivery conectados al restaurante.",
  },
};

export const INTEGRATION_CATALOG: IntegrationDefinition[] = [
  // Redes sociales
  {
    slug: "google-social",
    name: "Google",
    category: "social",
    description: "Perfil de negocio y visibilidad en búsqueda.",
    color: "#4285F4",
    logoPath: "/integrations/google.svg",
    connectable: true,
    connectionProvider: "google_business",
  },
  {
    slug: "tripadvisor",
    name: "TripAdvisor",
    category: "social",
    description: "Opiniones y perfil en TripAdvisor.",
    color: "#00AF87",
    profileField: "tripAdvisorUrl",
    settingsTab: "links",
    logoPath: "/integrations/tripadvisor.svg",
  },
  {
    slug: "instagram-social",
    name: "Instagram",
    category: "social",
    description: "Perfil de Instagram del restaurante.",
    color: "#E4405F",
    profileField: "instagramUrl",
    settingsTab: "links",
    logoPath: "/integrations/instagram.svg",
  },
  {
    slug: "facebook-social",
    name: "Facebook",
    category: "social",
    description: "Página de Facebook del local.",
    color: "#1877F2",
    logoPath: "/integrations/facebook.svg",
  },
  {
    slug: "whatsapp-social",
    name: "WhatsApp",
    category: "social",
    description: "Comunicación con comensales por WhatsApp.",
    color: "#25D366",
    envCheck: "twilio",
    logoPath: "/integrations/whatsapp.svg",
  },
  {
    slug: "thefork",
    name: "TheFork",
    category: "social",
    description: "Perfil y reservas en TheFork.",
    color: "#00594C",
    profileField: "theForkUrl",
    settingsTab: "links",
    logoPath: "/integrations/thefork.svg",
    connectable: true,
    connectionProvider: "thefork",
    statsKey: "THEFORK",
    showStats: true,
  },
  {
    slug: "tiktok",
    name: "TikTok",
    category: "social",
    description: "Perfil de TikTok del restaurante.",
    color: "#010101",
    profileField: "tiktokUrl",
    settingsTab: "links",
    logoPath: "/integrations/tiktok.svg",
  },
  {
    slug: "yelp",
    name: "Yelp",
    category: "social",
    description: "Directorio y reseñas en Yelp.",
    color: "#D32323",
  },

  // Canales de reservas
  {
    slug: "google-reserve",
    name: "Reserva con Google",
    category: "booking_channels",
    description: "Reservas directas mediante Búsqueda, Maps o el Asistente de Google.",
    color: "#4285F4",
    connectable: true,
    connectionProvider: "google_reserve",
    statsKey: "GOOGLE",
    showStats: true,
    logoPath: "/integrations/google.svg",
  },
  {
    slug: "facebook-business",
    name: "Facebook Business",
    category: "booking_channels",
    description: "Instala tu botón de reservas en Facebook e Instagram.",
    color: "#1877F2",
  },
  {
    slug: "channel-manager",
    name: "Channel Manager",
    category: "booking_channels",
    description: "Centraliza la distribución de reservas en todos tus canales.",
    color: "#F59E0B",
  },

  // Canales externos (Bookline)
  {
    slug: "instagram-channel",
    name: "Instagram",
    category: "external_channels",
    description: "Reservas recibidas desde Instagram.",
    color: "#E4405F",
    showStats: true,
    statsKey: "INSTAGRAM",
    connectable: true,
    connectionProvider: "instagram",
    logoPath: "/integrations/instagram.svg",
  },
  {
    slug: "opentable",
    name: "OpenTable",
    category: "external_channels",
    description: "Canal de reservas OpenTable.",
    color: "#DA3743",
    showStats: true,
    statsKey: "OPENTABLE",
    connectable: true,
    connectionProvider: "opentable",
    logoPath: "/integrations/opentable.svg",
  },
  {
    slug: "nomads-turismo",
    name: "NomadsTurismo",
    category: "external_channels",
    description: "Canal de turismo y experiencias.",
    color: "#0EA5E9",
    showStats: true,
  },
  {
    slug: "guia-repsol",
    name: "Guía Repsol",
    category: "external_channels",
    description: "Reservas desde la Guía Repsol.",
    color: "#E11D48",
    showStats: true,
  },
  {
    slug: "bonappo",
    name: "Bonappo",
    category: "external_channels",
    description: "Plataforma de reservas Bonappo.",
    color: "#8B5CF6",
    showStats: true,
  },
  {
    slug: "flambeapp",
    name: "Flambeapp",
    category: "external_channels",
    description: "Descubrimiento gastronómico en vídeo.",
    color: "#F97316",
    showStats: true,
  },
  {
    slug: "kop-stadium-channel",
    name: "KOP Stadium",
    category: "external_channels",
    description: "Reservas vinculadas a eventos deportivos.",
    color: "#1D4ED8",
    showStats: true,
  },
  {
    slug: "guia-macarfi",
    name: "Guía Macarfi",
    category: "external_channels",
    description: "Canal Macarfi de restaurantes.",
    color: "#059669",
    showStats: true,
  },
  {
    slug: "amex",
    name: "Amex",
    category: "external_channels",
    description: "Reservas American Express Dining.",
    color: "#006FCF",
    showStats: true,
  },
  {
    slug: "womo",
    name: "Womo",
    category: "external_channels",
    description: "Canal de reservas Womo.",
    color: "#7C3AED",
    showStats: true,
  },
  {
    slug: "simplenight",
    name: "SimpleNight",
    category: "external_channels",
    description: "Canal nocturno y ocio.",
    color: "#6366F1",
    showStats: true,
  },
  {
    slug: "silocomo",
    name: "Silocomo",
    category: "external_channels",
    description: "Plataforma Silocomo.",
    color: "#EAB308",
    showStats: true,
  },
  {
    slug: "dorsia",
    name: "Dorsia",
    category: "external_channels",
    description: "Reservas premium Dorsia.",
    color: "#171717",
    showStats: true,
  },
  {
    slug: "google-channel",
    name: "Google",
    category: "external_channels",
    description: "Reservas desde Google.",
    color: "#4285F4",
    showStats: true,
    logoPath: "/integrations/google.svg",
  },
  {
    slug: "amadeus",
    name: "Amadeus",
    category: "external_channels",
    description: "Distribución Amadeus Hospitality.",
    color: "#005EB8",
    showStats: true,
  },
  {
    slug: "facebook-channel",
    name: "Facebook",
    category: "external_channels",
    description: "Reservas desde Facebook.",
    color: "#1877F2",
    showStats: true,
    logoPath: "/integrations/facebook.svg",
  },
  {
    slug: "mozrest-audience",
    name: "Mozrest Audience",
    category: "external_channels",
    description: "Audiencias y remarketing Mozrest.",
    color: "#EC4899",
    showStats: true,
  },
  {
    slug: "widget",
    name: "Widget propio",
    category: "external_channels",
    description: "Reservas desde tu web o widget embebible.",
    color: "#18181B",
    statsKey: "WIDGET",
    showStats: true,
    shareType: "widget",
    alwaysAvailable: true,
  },
  {
    slug: "phone",
    name: "Teléfono",
    category: "external_channels",
    description: "Reservas tomadas por teléfono.",
    color: "#52525B",
    statsKey: "PHONE",
    showStats: true,
    alwaysAvailable: true,
  },
  {
    slug: "walk-in",
    name: "Walk-in",
    category: "external_channels",
    description: "Reservas en sala sin cita previa.",
    color: "#71717A",
    statsKey: "WALK_IN",
    showStats: true,
    alwaysAvailable: true,
  },

  // Asistentes telefónicos
  {
    slug: "bookline",
    name: "Bookline",
    category: "phone_assistants",
    description: "Centralita virtual para automatizar reservas.",
    color: "#F59E0B",
  },
  {
    slug: "bookybot",
    name: "BookyBot",
    category: "phone_assistants",
    description: "Asistente virtual de reservas de mesa.",
    color: "#3B82F6",
  },
  {
    slug: "wetalkee",
    name: "WeTalkee",
    category: "phone_assistants",
    description: "IA para gestionar reservas de mesa.",
    color: "#10B981",
  },
  {
    slug: "bencall",
    name: "Bencall",
    category: "phone_assistants",
    description: "Asistente telefónico para restaurantes.",
    color: "#8B5CF6",
  },
  {
    slug: "gulliver-ai",
    name: "Gulliver AI",
    category: "phone_assistants",
    description: "IA de voz y WhatsApp para reservas.",
    color: "#06B6D4",
  },
  {
    slug: "donimo",
    name: "Donimo",
    category: "phone_assistants",
    description: "IA conversacional para llamadas y pedidos.",
    color: "#F43F5E",
  },

  // Marketplace
  {
    slug: "explore",
    name: "Motor de Reservas",
    category: "marketplace",
    description: "Marketplace propio en /explore.",
    color: "#B45309",
    statsKey: "MARKETPLACE",
    profileField: "isListedOnMarketplace",
    showStats: true,
    shareType: "marketplace",
    href: "/explore",
  },
  {
    slug: "prima",
    name: "Prima",
    category: "marketplace",
    description: "Reservas de alta cocina y experiencias premium.",
    color: "#1E293B",
  },
  {
    slug: "flambea",
    name: "Flambea",
    category: "marketplace",
    description: "Descubrimiento gastronómico en vídeo.",
    color: "#EA580C",
  },
  {
    slug: "kop-stadium",
    name: "KOP Stadium",
    category: "marketplace",
    description: "Gestión de licencias TV para deportes en el local.",
    color: "#1D4ED8",
  },

  // Marketing
  {
    slug: "campaigns",
    name: "Campañas multicanal",
    category: "marketing",
    description: "Email, SMS y WhatsApp a segmentos con consentimiento.",
    color: "#7C3AED",
    href: "/dashboard/campaigns",
    envCheck: "resend",
  },

  // TPVs
  {
    slug: "square",
    name: "Square",
    category: "tpv",
    description: "POS Square — sincroniza pedidos al completar reservas.",
    color: "#006AFF",
    connectable: true,
    posProvider: "SQUARE",
    logoPath: "/integrations/square.svg",
  },
  {
    slug: "holded",
    name: "Holded",
    category: "tpv",
    description: "Facturación Holded — contactos y borradores de factura.",
    color: "#00B2A9",
    connectable: true,
    posProvider: "HOLDED",
    logoPath: "/integrations/holded.svg",
  },
  {
    slug: "agora",
    name: "Ágora",
    category: "tpv",
    description: "Herramienta para aumentar la rentabilidad del negocio.",
    color: "#DC2626",
  },
  {
    slug: "bdp-net",
    name: "BDP-NET",
    category: "tpv",
    description: "Gestión sencilla para hostelería.",
    color: "#2563EB",
  },
  {
    slug: "cuiner",
    name: "Cuiner",
    category: "tpv",
    description: "TPV para cafeterías, bares y restaurantes.",
    color: "#16A34A",
  },
  {
    slug: "glop",
    name: "Glop",
    category: "tpv",
    description: "Caja registradora en constante evolución.",
    color: "#9333EA",
  },
  {
    slug: "hosteltactil",
    name: "Hosteltáctil",
    category: "tpv",
    description: "Software de gestión para hostelería.",
    color: "#0891B2",
  },
  {
    slug: "revo",
    name: "Revo",
    category: "tpv",
    description: "Pedidos, cocina y organización de sala.",
    color: "#E11D48",
  },
  {
    slug: "simphony",
    name: "Simphony",
    category: "tpv",
    description: "POS Oracle para gestión integral del restaurante.",
    color: "#C2410C",
  },
  {
    slug: "winex-tpv",
    name: "WiNEX TPV",
    category: "tpv",
    description: "Software Windows, Android y Web.",
    color: "#4F46E5",
  },
  {
    slug: "yantar",
    name: "Yantar",
    category: "tpv",
    description: "Sistema de punto de venta Yantar.",
    color: "#15803D",
  },
  {
    slug: "frontrest",
    name: "FrontRest",
    category: "tpv",
    description: "Solución ICG para hostelería.",
    color: "#0F766E",
  },
  {
    slug: "last-app",
    name: "Last.app",
    category: "tpv",
    description: "Administración todo-en-uno desde un dispositivo.",
    color: "#BE123C",
  },
  {
    slug: "madisa",
    name: "Madisa",
    category: "tpv",
    description: "Sistema de punto de venta Madisa.",
    color: "#1E40AF",
  },
  {
    slug: "hiopos",
    name: "HIOPOS",
    category: "tpv",
    description: "Más que un punto de venta.",
    color: "#CA8A04",
  },

  // Asistentes de sala
  {
    slug: "wewelcom",
    name: "WeWelcom",
    category: "host_assistants",
    description: "Tecnología WE COPILOT para rentabilidad en sala.",
    color: "#0D9488",
  },

  // Analítica
  {
    slug: "google-analytics",
    name: "Google Analytics",
    category: "analytics",
    description: "Google Analytics y Tag Manager.",
    color: "#F9AB00",
  },
  {
    slug: "cookdata",
    name: "Cookdata",
    category: "analytics",
    description: "Plataforma de gestión e integración de datos.",
    color: "#7C2D12",
  },
  {
    slug: "adeci",
    name: "ADECI",
    category: "analytics",
    description: "Predicción de ventas, productos y afluencia.",
    color: "#4338CA",
  },
];

export function getIntegrationsByCategory(
  category: IntegrationCategory,
): IntegrationDefinition[] {
  return INTEGRATION_CATALOG.filter((i) => i.category === category);
}

export const CATEGORY_ORDER: IntegrationCategory[] = [
  "social",
  "booking_channels",
  "external_channels",
  "phone_assistants",
  "marketplace",
  "marketing",
  "tpv",
  "host_assistants",
  "analytics",
  "order_management",
];
