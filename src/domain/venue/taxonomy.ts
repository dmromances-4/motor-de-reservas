import { z } from "zod";

export type TaxonomyOption = {
  id: string;
  label: string;
  group: string;
};

export const MAX_SIGNATURE_DISHES = 5;

export const ESTABLISHMENT_TYPES: TaxonomyOption[] = [
  { id: "RESTAURANT", label: "Restaurante", group: "establishmentTypes" },
  { id: "COCKTAIL_BAR", label: "Coctelería", group: "establishmentTypes" },
  { id: "CAFE", label: "Cafetería", group: "establishmentTypes" },
  { id: "TAPAS_BAR", label: "Bar de tapas", group: "establishmentTypes" },
  { id: "BISTRO", label: "Bistró", group: "establishmentTypes" },
  { id: "GASTROBAR", label: "Gastrobar", group: "establishmentTypes" },
  { id: "WINERY", label: "Bodega", group: "establishmentTypes" },
];

export const CUISINE_TYPES: TaxonomyOption[] = [
  { id: "MEDITERRANEAN", label: "Mediterránea", group: "cuisineTypes" },
  { id: "FUSION", label: "Fusión", group: "cuisineTypes" },
  { id: "JAPANESE", label: "Japonesa", group: "cuisineTypes" },
  { id: "ITALIAN", label: "Italiana", group: "cuisineTypes" },
  { id: "SPANISH", label: "Española", group: "cuisineTypes" },
  { id: "FRENCH", label: "Francesa", group: "cuisineTypes" },
  { id: "CREATIVE", label: "Creativa", group: "cuisineTypes" },
  { id: "GRILL", label: "Asador", group: "cuisineTypes" },
  { id: "SEAFOOD", label: "Marisquería", group: "cuisineTypes" },
  { id: "VEGETARIAN", label: "Vegetariana", group: "cuisineTypes" },
];

export const IDEAL_FOR: TaxonomyOption[] = [
  { id: "ROMANTIC", label: "Romántico", group: "idealFor" },
  { id: "FAMILIES", label: "Familias", group: "idealFor" },
  { id: "BUSINESS", label: "Negocios", group: "idealFor" },
  { id: "GROUPS", label: "Grupos", group: "idealFor" },
  { id: "CELEBRATIONS", label: "Celebraciones", group: "idealFor" },
  { id: "SOLO_DINING", label: "Comer solo", group: "idealFor" },
];

export const VENUE_FEATURES: TaxonomyOption[] = [
  { id: "INDOOR_TERRACE", label: "Terraza interior", group: "venueFeatures" },
  { id: "OUTDOOR_TERRACE", label: "Terraza exterior", group: "venueFeatures" },
  { id: "SEA_VIEW", label: "Vistas al mar", group: "venueFeatures" },
  { id: "CITY_VIEW", label: "Vistas a la ciudad", group: "venueFeatures" },
  { id: "LIVE_MUSIC", label: "Música en directo", group: "venueFeatures" },
  { id: "PRIVATE_ROOM", label: "Sala privada", group: "venueFeatures" },
  { id: "OPEN_KITCHEN", label: "Cocina abierta", group: "venueFeatures" },
];

export const AWARD_BADGES: TaxonomyOption[] = [
  { id: "MICHELIN", label: "Guía Michelin", group: "awardBadges" },
  { id: "SOLES_REPSOL", label: "Soles Repsol", group: "awardBadges" },
  { id: "MACARFI", label: "Guía Macarfi", group: "awardBadges" },
  { id: "FIFTY_BEST", label: "The World's 50 Best", group: "awardBadges" },
  { id: "BIB_GOURMAND", label: "Bib Gourmand", group: "awardBadges" },
  { id: "GREEN_STAR", label: "Estrella Verde Michelin", group: "awardBadges" },
];

export const PREFERENCE_DIETARY: TaxonomyOption[] = [
  { id: "vegan_options", label: "Opciones veganas", group: "dietary" },
  { id: "lactose_free", label: "Opciones sin lactosa", group: "dietary" },
  { id: "kosher", label: "Comida kosher", group: "dietary" },
  { id: "low_sodium", label: "Bajo en sodio", group: "dietary" },
  { id: "allergy_adaptable", label: "Adaptable a alergias", group: "dietary" },
  { id: "vegetarian", label: "Opciones vegetarianas", group: "dietary" },
  { id: "gluten_free", label: "Opciones sin gluten", group: "dietary" },
  { id: "halal", label: "Comida halal", group: "dietary" },
  { id: "pescatarian", label: "Pescetariano", group: "dietary" },
];

export const PREFERENCE_ACCESSIBILITY: TaxonomyOption[] = [
  { id: "wheelchair_access", label: "Acceso para sillas de ruedas", group: "accessibility" },
  { id: "parking", label: "Estacionamiento", group: "accessibility" },
  { id: "public_transport", label: "Acceso transporte público", group: "accessibility" },
  { id: "accessible_restroom", label: "Baño accesible", group: "accessibility" },
  { id: "valet_parking", label: "Aparcacoches", group: "accessibility" },
];

export const PREFERENCE_PETS_KIDS: TaxonomyOption[] = [
  { id: "pets_allowed", label: "Mascotas", group: "petsKids" },
  { id: "kids_welcome", label: "Niños", group: "petsKids" },
  { id: "high_chair", label: "Trona", group: "petsKids" },
  { id: "stroller_friendly", label: "Cochecito de bebé", group: "petsKids" },
];

export const PREFERENCE_FACILITIES: TaxonomyOption[] = [
  { id: "smoking_area", label: "Zona de fumadores", group: "facilities" },
  { id: "air_conditioning", label: "Zona climatizada", group: "facilities" },
];

export const PREFERENCE_PAYMENTS: TaxonomyOption[] = [
  { id: "card_payment", label: "Tarjeta", group: "payments" },
  { id: "cash", label: "Efectivo", group: "payments" },
  { id: "bizum", label: "Bizum", group: "payments" },
];

export const PREFERENCE_EVENTS: TaxonomyOption[] = [
  { id: "sports_broadcast", label: "Transmisión deportiva", group: "events" },
  { id: "live_show", label: "Espectáculo", group: "events" },
];

export const ALL_PREFERENCE_TAGS = [
  ...PREFERENCE_DIETARY,
  ...PREFERENCE_ACCESSIBILITY,
  ...PREFERENCE_PETS_KIDS,
  ...PREFERENCE_FACILITIES,
  ...PREFERENCE_PAYMENTS,
  ...PREFERENCE_EVENTS,
];

export const DRESS_CODES = [
  { id: "CASUAL", label: "Casual" },
  { id: "SMART_CASUAL", label: "Smart casual" },
  { id: "FORMAL", label: "Formal" },
  { id: "ELEGANT", label: "Elegante" },
  { id: "NO_REQUIREMENT", label: "Sin requisito" },
] as const;

export const AVERAGE_TICKET_RANGES = [
  { id: "LT_15", label: "<15€" },
  { id: "RANGE_15_30", label: "15–30€" },
  { id: "RANGE_30_50", label: "30–50€" },
  { id: "GT_50", label: "+50€" },
] as const;

export type AverageTicketRangeId = (typeof AVERAGE_TICKET_RANGES)[number]["id"];
export type DressCodeId = (typeof DRESS_CODES)[number]["id"];

const ids = (options: TaxonomyOption[]) => new Set(options.map((o) => o.id));

export const TAXONOMY_IDS = {
  establishmentTypes: ids(ESTABLISHMENT_TYPES),
  cuisineTypes: ids(CUISINE_TYPES),
  idealFor: ids(IDEAL_FOR),
  venueFeatures: ids(VENUE_FEATURES),
  awardBadges: ids(AWARD_BADGES),
  preferenceTags: ids(ALL_PREFERENCE_TAGS),
};

export function getTaxonomyByGroup(group: keyof typeof TAXONOMY_IDS): TaxonomyOption[] {
  switch (group) {
    case "establishmentTypes":
      return ESTABLISHMENT_TYPES;
    case "cuisineTypes":
      return CUISINE_TYPES;
    case "idealFor":
      return IDEAL_FOR;
    case "venueFeatures":
      return VENUE_FEATURES;
    case "awardBadges":
      return AWARD_BADGES;
    case "preferenceTags":
      return ALL_PREFERENCE_TAGS;
    default:
      return [];
  }
}

export function validateVenueTags(tags: string[], allowed: Set<string>): string[] {
  return tags.filter((t) => allowed.has(t));
}

export function labelForTag(id: string, options: TaxonomyOption[]): string {
  return options.find((o) => o.id === id)?.label ?? id;
}

export function normalizeSocialUrl(
  value: string | undefined | null,
  platform: "instagram" | "tiktok",
): string | undefined {
  if (!value?.trim()) return undefined;
  const v = value.trim();
  if (v.startsWith("http")) return v;
  const handle = v.replace(/^@/, "");
  if (platform === "instagram") return `https://instagram.com/${handle}`;
  return `https://tiktok.com/@${handle}`;
}

function tagsSchema(allowed: Set<string>) {
  return z.array(z.string()).refine((arr) => arr.every((t) => allowed.has(t)), {
    message: "Invalid taxonomy tag",
  });
}

export const venueIdentitySchema = z.object({
  establishmentTypes: tagsSchema(TAXONOMY_IDS.establishmentTypes).default([]),
  cuisineTypes: tagsSchema(TAXONOMY_IDS.cuisineTypes).default([]),
  signatureDishes: z
    .array(z.string().min(1).max(120))
    .max(MAX_SIGNATURE_DISHES)
    .default([]),
});

export const venueAmbienceSchema = z.object({
  idealFor: tagsSchema(TAXONOMY_IDS.idealFor).default([]),
  venueFeatures: tagsSchema(TAXONOMY_IDS.venueFeatures).default([]),
  neighborhood: z.string().max(120).optional(),
});

export const venuePricingSchema = z.object({
  averageTicketRange: z
    .enum(["LT_15", "RANGE_15_30", "RANGE_30_50", "GT_50"])
    .optional()
    .nullable(),
  hasDailyMenu: z.boolean().default(false),
  dailyMenuDescription: z.string().max(300).optional(),
});

export const venueAwardsSchema = z
  .object({
    awardBadges: tagsSchema(TAXONOMY_IDS.awardBadges).default([]),
    michelinStars: z.number().int().min(1).max(3).optional().nullable(),
    fiftyBestRank: z.number().int().min(1).max(100).optional().nullable(),
  })
  .refine(
    (data) => !data.michelinStars || data.awardBadges.includes("MICHELIN"),
    { message: "michelinStars requiere el galardón MICHELIN" },
  )
  .refine(
    (data) => !data.fiftyBestRank || data.awardBadges.includes("FIFTY_BEST"),
    { message: "fiftyBestRank requiere el galardón FIFTY_BEST" },
  );

export const venueLinksSchema = z.object({
  instagramUrl: z.string().max(500).optional(),
  tripAdvisorUrl: z.string().url().max(500).optional().or(z.literal("")),
  theForkUrl: z.string().url().max(500).optional().or(z.literal("")),
  tiktokUrl: z.string().max(500).optional(),
});

export const venuePreferencesSchema = z.object({
  preferenceTags: tagsSchema(TAXONOMY_IDS.preferenceTags).default([]),
  dressCode: z
    .enum(["CASUAL", "SMART_CASUAL", "FORMAL", "ELEGANT", "NO_REQUIREMENT"])
    .optional()
    .nullable(),
});

const taxonomyId = (allowed: Set<string>) =>
  z
    .string()
    .optional()
    .refine((v) => !v || allowed.has(v), { message: "Invalid taxonomy tag" });

export const marketplaceSearchExtendedSchema = z.object({
  city: z.string().optional(),
  cuisine: taxonomyId(TAXONOMY_IDS.cuisineTypes),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  partySize: z.coerce.number().int().min(1).max(50).optional(),
  averageTicketRange: z
    .enum(["LT_15", "RANGE_15_30", "RANGE_30_50", "GT_50"])
    .optional(),
  guide: z
    .enum([
      "MACARFI",
      "MICHELIN",
      "FIFTY_BEST",
      "SOLES_REPSOL",
      "BIB_GOURMAND",
      "GREEN_STAR",
    ])
    .optional(),
  establishmentType: taxonomyId(TAXONOMY_IDS.establishmentTypes),
  idealFor: taxonomyId(TAXONOMY_IDS.idealFor),
  preference: taxonomyId(TAXONOMY_IDS.preferenceTags),
  dressCode: z
    .enum(["CASUAL", "SMART_CASUAL", "FORMAL", "ELEGANT", "NO_REQUIREMENT"])
    .optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  radiusKm: z.coerce.number().positive().optional(),
  north: z.coerce.number().optional(),
  south: z.coerce.number().optional(),
  east: z.coerce.number().optional(),
  west: z.coerce.number().optional(),
  sort: z.enum(["distance", "rating"]).optional(),
  cursor: z.string().optional(),
  take: z.coerce.number().int().min(1).max(100).optional(),
});
