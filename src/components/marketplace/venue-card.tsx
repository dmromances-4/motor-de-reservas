import Link from "next/link";
import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AwardBadges } from "@/components/marketplace/award-badges";
import type { MarketplaceVenueResult } from "@/domain/marketplace/search-service";
import { labelForTag, CUISINE_TYPES, AVERAGE_TICKET_RANGES } from "@/domain/venue/taxonomy";

const TICKET_LABELS = Object.fromEntries(
  AVERAGE_TICKET_RANGES.map((r) => [r.id, r.label]),
);

export function VenueCard({
  venue,
  highlighted = false,
}: {
  venue: MarketplaceVenueResult;
  highlighted?: boolean;
}) {
  const cuisineLabel =
    venue.cuisineTypes.length > 0
      ? venue.cuisineTypes
          .map((id) => labelForTag(id, CUISINE_TYPES))
          .join(", ")
      : null;

  return (
    <Link href={`/venues/${venue.slug}`} className="group block">
      <Card
        className={`overflow-hidden transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-[var(--teal)] ${highlighted ? "border-[var(--teal)] ring-2 ring-[var(--teal)]/30" : ""}`}
      >
        <div
          className="h-40"
          style={
            venue.coverImageUrl
              ? {
                  backgroundImage: `url(${venue.coverImageUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : { backgroundColor: "var(--bg-2)" }
          }
        />
        <CardContent className="space-y-2 pt-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display font-semibold" style={{ color: "var(--ink)" }}>
              {venue.name}
            </h3>
            {venue.averageRating > 0 && (
              <span
                className="flex items-center gap-1 text-sm font-semibold"
                style={{ color: "var(--teal-deep)" }}
              >
                <Star className="h-4 w-4 fill-current" />
                {venue.averageRating.toFixed(1)}
              </span>
            )}
          </div>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {cuisineLabel}
            {venue.city ? ` · ${venue.city}` : ""}
            {venue.averageTicketRange
              ? ` · ${TICKET_LABELS[venue.averageTicketRange] ?? ""}`
              : ""}
          </p>
          <AwardBadges
            awardBadges={venue.awardBadges}
            michelinStars={venue.michelinStars}
            fiftyBestRank={venue.fiftyBestRank}
          />
          {venue.description && (
            <p className="line-clamp-2 text-sm" style={{ color: "var(--text)" }}>
              {venue.description}
            </p>
          )}
          {venue.hasAvailability === false && (
            <p className="text-xs text-red-600">Sin disponibilidad</p>
          )}
          {venue.depositAmountCents > 0 && (
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              Depósito: {(venue.depositAmountCents / 100).toFixed(2)} €
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
