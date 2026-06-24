import { z } from "zod";

const optionalPhone = z
  .string()
  .optional()
  .transform((v) => {
    const trimmed = v?.trim();
    return trimmed ? trimmed : undefined;
  })
  .pipe(z.string().min(6).max(20).optional());

const optionalText = z
  .string()
  .optional()
  .transform((v) => {
    const trimmed = v?.trim();
    return trimmed ? trimmed : undefined;
  });

export const availabilityQuerySchema = z.object({
  venueId: z.string().optional(),
  slug: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  partySize: z.coerce.number().int().min(1).max(50),
  serviceId: z.string().optional(),
});

export const createReservationSchema = z.object({
  slug: z.string().min(1),
  serviceId: z.string().min(1),
  dateTime: z.string().datetime(),
  partySize: z.coerce.number().int().min(1).max(50),
  firstName: z.string().min(1).max(100),
  lastName: z.string().max(100).optional(),
  email: z.string().email(),
  phone: optionalPhone,
  notes: optionalText.pipe(z.string().max(500).optional()),
  allergies: optionalText.pipe(z.string().max(500).optional()),
  source: z.enum(["WIDGET", "PHONE", "WALK_IN", "MARKETPLACE"]).default("WIDGET"),
  promoCode: optionalText.pipe(z.string().max(32).optional()),
});

export const updateReservationSchema = z.object({
  status: z
    .enum(["PENDING", "CONFIRMED", "SEATED", "COMPLETED", "CANCELLED", "NO_SHOW"])
    .optional(),
  partySize: z.number().int().min(1).max(50).optional(),
  dateTime: z.string().datetime().optional(),
  notes: z.string().max(500).optional(),
});

export const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  venueName: z.string().min(2),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const dinerSignupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  referralCode: z.string().max(32).optional(),
});

export {
  marketplaceSearchExtendedSchema as marketplaceSearchSchema,
  venueIdentitySchema,
  venueAmbienceSchema,
  venuePricingSchema,
  venueAwardsSchema,
  venueLinksSchema,
  venuePreferencesSchema,
} from "@/domain/venue/taxonomy";

export const checkoutSchema = z.object({
  slug: z.string().min(1),
  serviceId: z.string().min(1),
  dateTime: z.string().datetime(),
  partySize: z.coerce.number().int().min(1).max(50),
  firstName: z.string().min(1).max(100),
  lastName: z.string().max(100).optional(),
  email: z.string().email(),
  phone: optionalPhone,
  notes: optionalText.pipe(z.string().max(500).optional()),
  allergies: optionalText.pipe(z.string().max(500).optional()),
  promoCode: optionalText.pipe(z.string().max(32).optional()),
});

export const reviewSchema = z.object({
  reservationId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export const waitlistSchema = z.object({
  slug: z.string(),
  serviceId: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  partySize: z.coerce.number().int().min(1).max(50),
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  email: z.string().email(),
  phone: z.string().optional(),
  preferredTime: z.string().optional(),
});
