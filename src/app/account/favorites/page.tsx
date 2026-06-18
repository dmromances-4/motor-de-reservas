import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VenueCard } from "@/components/marketplace/venue-card";

export default async function AccountFavoritesPage() {
  const session = await auth();
  if (!session?.user) redirect("/account/login");

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    include: { venue: true },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Mis favoritos</h1>
      {favorites.length === 0 ? (
        <p className="text-zinc-500">No has guardado locales aún.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((f) => (
            <VenueCard
              key={f.id}
              venue={{
                id: f.venue.id,
                slug: f.venue.slug,
                name: f.venue.name,
                city: f.venue.city,
                latitude: f.venue.latitude,
                longitude: f.venue.longitude,
                googlePlaceId: f.venue.googlePlaceId,
                cuisineTypes: f.venue.cuisineTypes,
                averageTicketRange: f.venue.averageTicketRange,
                averageRating: f.venue.averageRating,
                reviewCount: f.venue.reviewCount,
                coverImageUrl: f.venue.coverImageUrl,
                description: f.venue.description,
                depositAmountCents: f.venue.depositAmountCents,
                awardBadges: f.venue.awardBadges,
                michelinStars: f.venue.michelinStars,
                fiftyBestRank: f.venue.fiftyBestRank,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
