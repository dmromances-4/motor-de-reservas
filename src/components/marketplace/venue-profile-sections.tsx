import {
  labelForTag,
  CUISINE_TYPES,
  ESTABLISHMENT_TYPES,
  IDEAL_FOR,
  VENUE_FEATURES,
  DRESS_CODES,
  AVERAGE_TICKET_RANGES,
  ALL_PREFERENCE_TAGS,
} from "@/domain/venue/taxonomy";
import type { AverageTicketRange, DressCode } from "@/generated/prisma/client";

type VenueProfile = {
  establishmentTypes: string[];
  cuisineTypes: string[];
  signatureDishes: string[];
  idealFor: string[];
  venueFeatures: string[];
  neighborhood: string | null;
  averageTicketRange: AverageTicketRange | null;
  hasDailyMenu: boolean;
  dailyMenuDescription: string | null;
  preferenceTags: string[];
  dressCode: DressCode | null;
  instagramUrl: string | null;
  tripAdvisorUrl: string | null;
  theForkUrl: string | null;
  tiktokUrl: string | null;
};

function TagList({ title, tags }: { title: string; tags: string[] }) {
  if (tags.length === 0) return null;
  return (
    <div>
      <h3
        className="font-display text-sm font-semibold"
        style={{ color: "var(--ink)" }}
      >
        {title}
      </h3>
      <ul className="mt-2 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <li
            key={tag}
            className="rounded-full px-2.5 py-1 text-xs"
            style={{ backgroundColor: "var(--bg-2)", color: "var(--text)" }}
          >
            {tag}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function VenueProfileSections({ venue }: { venue: VenueProfile }) {
  const ticketLabel = venue.averageTicketRange
    ? AVERAGE_TICKET_RANGES.find((r) => r.id === venue.averageTicketRange)?.label
    : null;
  const dressLabel = venue.dressCode
    ? DRESS_CODES.find((d) => d.id === venue.dressCode)?.label
    : null;

  const preferenceLabels = venue.preferenceTags.map((id) =>
    labelForTag(id, ALL_PREFERENCE_TAGS),
  );

  const links = [
    { label: "Instagram", url: venue.instagramUrl },
    { label: "TikTok", url: venue.tiktokUrl },
    { label: "TripAdvisor", url: venue.tripAdvisorUrl },
    { label: "TheFork", url: venue.theForkUrl },
  ].filter((l) => l.url);

  return (
    <div className="space-y-6">
      {venue.neighborhood && (
        <p className="text-sm" style={{ color: "var(--text)" }}>
          <span className="font-medium" style={{ color: "var(--ink)" }}>
            Zona:
          </span>{" "}
          {venue.neighborhood}
        </p>
      )}
      {ticketLabel && (
        <p className="text-sm" style={{ color: "var(--text)" }}>
          <span className="font-medium" style={{ color: "var(--ink)" }}>
            Ticket medio:
          </span>{" "}
          {ticketLabel}
        </p>
      )}
      {dressLabel && (
        <p className="text-sm" style={{ color: "var(--text)" }}>
          <span className="font-medium" style={{ color: "var(--ink)" }}>
            Dress code:
          </span>{" "}
          {dressLabel}
        </p>
      )}

      <TagList
        title="Tipo de establecimiento"
        tags={venue.establishmentTypes.map((id) =>
          labelForTag(id, ESTABLISHMENT_TYPES),
        )}
      />
      <TagList
        title="Cocina"
        tags={venue.cuisineTypes.map((id) => labelForTag(id, CUISINE_TYPES))}
      />
      {venue.signatureDishes.length > 0 && (
        <TagList title="Platos estrella" tags={venue.signatureDishes} />
      )}
      <TagList
        title="Ideal para"
        tags={venue.idealFor.map((id) => labelForTag(id, IDEAL_FOR))}
      />
      <TagList
        title="Características"
        tags={venue.venueFeatures.map((id) => labelForTag(id, VENUE_FEATURES))}
      />

      {venue.hasDailyMenu && (
        <div>
          <h3
            className="font-display text-sm font-semibold"
            style={{ color: "var(--ink)" }}
          >
            Menú del día
          </h3>
          <p className="mt-1 text-sm" style={{ color: "var(--text)" }}>
            {venue.dailyMenuDescription ?? "Disponible"}
          </p>
        </div>
      )}

      {preferenceLabels.length > 0 && (
        <TagList title="Preferencias" tags={preferenceLabels} />
      )}

      {links.length > 0 && (
        <div>
          <h3
            className="font-display text-sm font-semibold"
            style={{ color: "var(--ink)" }}
          >
            Enlaces
          </h3>
          <ul className="mt-2 space-y-1 text-sm">
            {links.map((link) => (
              <li key={link.label}>
                <a
                  href={link.url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium hover:underline"
                  style={{ color: "var(--teal-deep)" }}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
