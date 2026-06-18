import { streetViewImageUrl } from "@/lib/google";

type StreetViewPanelProps = {
  latitude?: number | null;
  longitude?: number | null;
  googlePlaceId?: string | null;
  venueName: string;
};

export function StreetViewPanel({
  latitude,
  longitude,
  googlePlaceId,
  venueName,
}: StreetViewPanelProps) {
  const imageUrl = streetViewImageUrl({
    latitude,
    longitude,
    placeId: googlePlaceId,
    width: 800,
    height: 400,
  });

  if (!imageUrl) return null;

  return (
    <section className="space-y-2">
      <h2 className="font-display text-lg font-semibold" style={{ color: "var(--ink)" }}>
        Fachada
      </h2>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={`Vista de calle de ${venueName}`}
        className="w-full rounded-2xl border border-[var(--line)] object-cover"
        height={400}
      />
    </section>
  );
}
