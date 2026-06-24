"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function HostDateFilter({ defaultDate }: { defaultDate: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const value = searchParams.get("date") ?? defaultDate;

  return (
    <div className="flex items-end gap-2">
      <div>
        <Label htmlFor="host-date" className="text-xs text-zinc-500">
          Fecha de servicio
        </Label>
        <Input
          id="host-date"
          type="date"
          value={value}
          className="w-44"
          onChange={(e) => {
            const params = new URLSearchParams(searchParams.toString());
            params.set("date", e.target.value);
            router.push(`/dashboard/host?${params.toString()}`);
          }}
        />
      </div>
    </div>
  );
}
