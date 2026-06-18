"use client";

import { Button } from "@/components/ui/button";
import { togglePromo } from "@/app/actions/marketing";

export function TogglePromoButton({
  venueId,
  promoId,
  isActive,
}: {
  venueId: string;
  promoId: string;
  isActive: boolean;
}) {
  return (
    <Button
      size="sm"
      variant={isActive ? "outline" : "default"}
      onClick={() => togglePromo(venueId, promoId, !isActive)}
    >
      {isActive ? "Desactivar" : "Activar"}
    </Button>
  );
}
