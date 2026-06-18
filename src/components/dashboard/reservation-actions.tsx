"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function ReservationActions({
  reservationId,
  currentStatus,
}: {
  reservationId: string;
  currentStatus: string;
}) {
  const router = useRouter();

  async function updateStatus(status: string) {
    await fetch(`/api/reservations/${reservationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      {currentStatus === "PENDING" && (
        <Button size="sm" onClick={() => updateStatus("CONFIRMED")}>
          Confirmar
        </Button>
      )}
      {["PENDING", "CONFIRMED"].includes(currentStatus) && (
        <Button size="sm" onClick={() => updateStatus("SEATED")}>
          Sentar
        </Button>
      )}
      {currentStatus === "SEATED" && (
        <Button size="sm" onClick={() => updateStatus("COMPLETED")}>
          Completar
        </Button>
      )}
      {!["CANCELLED", "COMPLETED", "NO_SHOW"].includes(currentStatus) && (
        <>
          <Button
            size="sm"
            variant="outline"
            onClick={() => updateStatus("NO_SHOW")}
          >
            No show
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => updateStatus("CANCELLED")}
          >
            Cancelar
          </Button>
        </>
      )}
    </div>
  );
}
