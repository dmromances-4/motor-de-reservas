import { Award, Star } from "lucide-react";

const AWARD_STYLES: Record<
  string,
  { label: string; className: string }
> = {
  MACARFI: {
    label: "Macarfi",
    className: "bg-amber-100 text-amber-900 border-amber-200",
  },
  MICHELIN: {
    label: "Michelin",
    className: "bg-red-100 text-red-900 border-red-200",
  },
  FIFTY_BEST: {
    label: "50 Best",
    className: "bg-violet-100 text-violet-900 border-violet-200",
  },
  SOLES_REPSOL: {
    label: "Soles Repsol",
    className: "bg-orange-100 text-orange-900 border-orange-200",
  },
  BIB_GOURMAND: {
    label: "Bib Gourmand",
    className: "bg-rose-100 text-rose-900 border-rose-200",
  },
  GREEN_STAR: {
    label: "Estrella Verde",
    className: "bg-emerald-100 text-emerald-900 border-emerald-200",
  },
};

type Props = {
  awardBadges: string[];
  michelinStars?: number | null;
  fiftyBestRank?: number | null;
  size?: "sm" | "md";
};

export function AwardBadges({
  awardBadges,
  michelinStars,
  fiftyBestRank,
  size = "sm",
}: Props) {
  if (awardBadges.length === 0 && !michelinStars && !fiftyBestRank) {
    return null;
  }

  const textSize = size === "sm" ? "text-xs" : "text-sm";
  const padding = size === "sm" ? "px-2 py-0.5" : "px-2.5 py-1";

  return (
    <div className="flex flex-wrap gap-1.5">
      {awardBadges.map((badge) => {
        const style = AWARD_STYLES[badge];
        if (!style) return null;
        return (
          <span
            key={badge}
            className={`inline-flex items-center gap-1 rounded-full border font-medium ${textSize} ${padding} ${style.className}`}
          >
            <Award className="h-3 w-3" />
            {style.label}
            {badge === "MICHELIN" && michelinStars ? (
              <span className="inline-flex items-center gap-0.5">
                {Array.from({ length: michelinStars }).map((_, i) => (
                  <Star key={i} className="h-2.5 w-2.5 fill-current" />
                ))}
              </span>
            ) : null}
            {badge === "FIFTY_BEST" && fiftyBestRank ? (
              <span>#{fiftyBestRank}</span>
            ) : null}
          </span>
        );
      })}
    </div>
  );
}
