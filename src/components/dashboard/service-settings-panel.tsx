"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateService, updateServiceSchedule } from "@/app/actions/dashboard";

const DAYS = [
  { value: 0, label: "Dom" },
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mié" },
  { value: 4, label: "Jue" },
  { value: 5, label: "Vie" },
  { value: 6, label: "Sáb" },
];

type ServiceItem = {
  id: string;
  name: string;
  durationMinutes: number;
  maxCoversPerSlot: number | null;
  maxReservationsPerSlot: number | null;
  schedules: Array<{
    id: string;
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
    isActive: boolean;
  }>;
};

export function ServiceSettingsPanel({
  venueId,
  services,
}: {
  venueId: string;
  services: ServiceItem[];
}) {
  const [message, setMessage] = useState("");

  async function saveService(e: React.FormEvent<HTMLFormElement>, serviceId: string) {
    e.preventDefault();
    setMessage("");
    const form = new FormData(e.currentTarget);
    const maxCovers = String(form.get("maxCoversPerSlot") ?? "").trim();
    const maxReservations = String(form.get("maxReservationsPerSlot") ?? "").trim();

    await updateService({
      venueId,
      serviceId,
      name: String(form.get("name") ?? ""),
      durationMinutes: Number(form.get("durationMinutes")),
      maxCoversPerSlot: maxCovers ? Number(maxCovers) : null,
      maxReservationsPerSlot: maxReservations ? Number(maxReservations) : null,
    });
    setMessage("Servicio actualizado.");
  }

  async function saveSchedule(
    serviceId: string,
    dayOfWeek: number,
    form: HTMLFormElement,
  ) {
    const openTime = String(new FormData(form).get(`open-${dayOfWeek}`) ?? "");
    const closeTime = String(new FormData(form).get(`close-${dayOfWeek}`) ?? "");
    const isActive = new FormData(form).get(`active-${dayOfWeek}`) === "on";

    await updateServiceSchedule({
      venueId,
      serviceId,
      dayOfWeek,
      openTime,
      closeTime,
      isActive,
    });
    setMessage("Horario actualizado.");
  }

  if (services.length === 0) {
    return <p className="text-sm text-zinc-500">No hay servicios configurados.</p>;
  }

  return (
    <div className="space-y-8">
      {message && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {message}
        </p>
      )}
      {services.map((service) => (
        <form
          key={service.id}
          onSubmit={(e) => saveService(e, service.id)}
          className="space-y-4 rounded-xl border border-zinc-200 p-4"
        >
          <h3 className="font-semibold">{service.name}</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label>Nombre del turno</Label>
              <Input name="name" defaultValue={service.name} required />
            </div>
            <div>
              <Label>Duración (min)</Label>
              <Input
                name="durationMinutes"
                type="number"
                min={30}
                step={15}
                defaultValue={service.durationMinutes}
              />
            </div>
            <div>
              <Label>Máx. cubiertos por turno</Label>
              <Input
                name="maxCoversPerSlot"
                type="number"
                min={1}
                placeholder="Sin límite"
                defaultValue={service.maxCoversPerSlot ?? ""}
              />
            </div>
            <div>
              <Label>Máx. reservas por turno</Label>
              <Input
                name="maxReservationsPerSlot"
                type="number"
                min={1}
                placeholder="Sin límite"
                defaultValue={service.maxReservationsPerSlot ?? ""}
              />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-zinc-700">Horarios semanales</p>
            <div className="grid gap-2">
              {DAYS.map((day) => {
                const schedule = service.schedules.find(
                  (s) => s.dayOfWeek === day.value,
                );
                return (
                  <div
                    key={day.value}
                    className="grid grid-cols-[3rem_1fr_1fr_auto] items-center gap-2 text-sm"
                  >
                    <span className="font-medium">{day.label}</span>
                    <Input
                      name={`open-${day.value}`}
                      type="time"
                      defaultValue={schedule?.openTime ?? "13:00"}
                      onBlur={(e) =>
                        saveSchedule(service.id, day.value, e.currentTarget.form!)
                      }
                    />
                    <Input
                      name={`close-${day.value}`}
                      type="time"
                      defaultValue={schedule?.closeTime ?? "23:30"}
                      onBlur={(e) =>
                        saveSchedule(service.id, day.value, e.currentTarget.form!)
                      }
                    />
                    <label className="flex items-center gap-1 text-xs text-zinc-600">
                      <input
                        type="checkbox"
                        name={`active-${day.value}`}
                        defaultChecked={schedule?.isActive ?? false}
                        onChange={(e) =>
                          saveSchedule(service.id, day.value, e.currentTarget.form!)
                        }
                      />
                      Activo
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          <Button type="submit" size="sm">
            Guardar turno
          </Button>
        </form>
      ))}
    </div>
  );
}
