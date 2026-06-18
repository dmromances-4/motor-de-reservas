import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Star } from "lucide-react";
import { getMarketplaceVenue } from "@/domain/marketplace/search-service";
import { AwardBadges } from "@/components/marketplace/award-badges";
import { BookingWidget } from "@/components/booking/booking-widget";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { labelForTag, CUISINE_TYPES } from "@/domain/venue/taxonomy";
import { VenueProfileSections } from "@/components/marketplace/venue-profile-sections";
import { StreetViewPanel } from "@/components/marketplace/street-view-panel";
import { appBaseUrl } from "@/lib/google";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const venue = await getMarketplaceVenue(slug);
  if (!venue) return { title: "Local no encontrado" };
  return {
    title: `${venue.name} — Reservar mesa`,
    description:
      venue.description ??
      `Reserva en ${venue.name}${venue.city ? `, ${venue.city}` : ""}`,
  };
}

export default async function VenuePage({ params }: Props) {
  const { slug } = await params;
  const venue = await getMarketplaceVenue(slug);
  if (!venue) notFound();

  const cuisineLabel = venue.cuisineTypes
    .map((id) => labelForTag(id, CUISINE_TYPES))
    .join(", ");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: venue.name,
    description: venue.description ?? undefined,
    url: `${appBaseUrl()}/venues/${venue.slug}`,
    image: venue.coverImageUrl ?? undefined,
    address: venue.address
      ? {
          "@type": "PostalAddress",
          streetAddress: venue.address,
          addressLocality: venue.city ?? undefined,
          postalCode: venue.postalCode ?? undefined,
        }
      : undefined,
    geo:
      venue.latitude != null && venue.longitude != null
        ? {
            "@type": "GeoCoordinates",
            latitude: venue.latitude,
            longitude: venue.longitude,
          }
        : undefined,
    aggregateRating:
      venue.reviewCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: venue.averageRating,
            reviewCount: venue.reviewCount,
          }
        : undefined,
    servesCuisine: cuisineLabel || undefined,
    telephone: venue.phone ?? undefined,
  };

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mb-6">
        <Link
          href="/explore"
          className="text-sm font-medium transition-colors"
          style={{ color: "var(--muted)" }}
        >
          ← Volver a explorar
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <div
            className="h-64 rounded-2xl"
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
          <div>
            <h1 className="font-display text-3xl font-semibold" style={{ color: "var(--ink)" }}>
              {venue.name}
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
              {cuisineLabel}
              {venue.city ? ` · ${venue.city}` : ""}
              {venue.address ? ` · ${venue.address}` : ""}
            </p>
            {venue.averageRating > 0 && (
              <p
                className="mt-2 flex items-center gap-1 font-semibold"
                style={{ color: "var(--teal-deep)" }}
              >
                <Star className="h-4 w-4 fill-current" />
                {venue.averageRating.toFixed(1)} ({venue.reviewCount}{" "}
                reseñas)
              </p>
            )}
            <div className="mt-3">
              <AwardBadges
                awardBadges={venue.awardBadges}
                michelinStars={venue.michelinStars}
                fiftyBestRank={venue.fiftyBestRank}
                size="md"
              />
            </div>
          </div>
          {venue.description && (
            <p style={{ color: "var(--text)" }}>{venue.description}</p>
          )}
          {venue.depositAmountCents > 0 && (
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Depósito requerido:{" "}
              {(venue.depositAmountCents / 100).toFixed(2)} €
            </p>
          )}

          <VenueProfileSections venue={venue} />

          <StreetViewPanel
            latitude={venue.latitude}
            longitude={venue.longitude}
            googlePlaceId={venue.googlePlaceId}
            venueName={venue.name}
          />

          <Card>
            <CardHeader>
              <CardTitle>Reseñas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {venue.reviews.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--muted)" }}>
                  Aún no hay reseñas.
                </p>
              ) : (
                venue.reviews.map((review) => (
                  <div
                    key={review.id}
                    className="border-b pb-3 last:border-0"
                    style={{ borderColor: "var(--line)" }}
                  >
                    <p className="font-medium" style={{ color: "var(--ink)" }}>
                      {review.user.name}
                    </p>
                    <p className="text-sm" style={{ color: "var(--pop)" }}>
                      {"★".repeat(review.rating)}
                    </p>
                    {review.comment && (
                      <p className="mt-1 text-sm" style={{ color: "var(--text)" }}>
                        {review.comment}
                      </p>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <BookingWidget
            slug={slug}
            source="MARKETPLACE"
            depositAmountCents={venue.depositAmountCents}
          />
          <div className="mt-4 text-center">
            <Button asChild variant="ghost" size="sm">
              <Link href="/account/login">Inicia sesión para guardar favoritos</Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
