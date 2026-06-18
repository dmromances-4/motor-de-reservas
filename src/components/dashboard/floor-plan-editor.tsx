"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createTable,
  createZone,
  deleteTable,
  deleteZone,
  updateTableDetails,
  updateTableLayout,
  updateZone,
} from "@/app/actions/floor-plan";

type TableItem = {
  id: string;
  name: string;
  minCapacity: number;
  maxCapacity: number;
  posX: number;
  posY: number;
  width: number;
  height: number;
  rotation: number;
  shape: string;
};

type ZoneItem = {
  id: string;
  name: string;
  layoutWidth: number;
  layoutHeight: number;
  backgroundUrl: string | null;
  tables: TableItem[];
};

export function FloorPlanEditor({
  venueId,
  zones: initialZones,
}: {
  venueId: string;
  zones: ZoneItem[];
}) {
  const [activeZone, setActiveZone] = useState(initialZones[0]?.id ?? "");
  const zone = initialZones.find((z) => z.id === activeZone) ?? initialZones[0];
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const table = zone?.tables.find((t) => t.id === selectedTable);

  async function onDragEnd(tableId: string, posX: number, posY: number) {
    await updateTableLayout(venueId, tableId, { posX, posY });
  }

  async function onAddTable(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!zone) return;
    const form = new FormData(e.currentTarget);
    await createTable(venueId, zone.id, {
      name: String(form.get("name")),
      minCapacity: Number(form.get("minCapacity")),
      maxCapacity: Number(form.get("maxCapacity")),
      posX: 40,
      posY: 40,
    });
    e.currentTarget.reset();
  }

  async function onAddZone(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await createZone(venueId, { name: String(form.get("zoneName")) });
    e.currentTarget.reset();
  }

  if (!zone) {
    return (
      <form onSubmit={onAddZone} className="flex gap-2">
        <Input name="zoneName" placeholder="Nombre de zona" required />
        <Button type="submit">Crear zona</Button>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <select
          value={activeZone}
          onChange={(e) => setActiveZone(e.target.value)}
          className="h-10 rounded-md border border-zinc-300 px-3 text-sm"
        >
          {initialZones.map((z) => (
            <option key={z.id} value={z.id}>
              {z.name}
            </option>
          ))}
        </select>
        <form onSubmit={onAddZone} className="flex gap-2">
          <Input name="zoneName" placeholder="Nueva zona" className="h-10" />
          <Button type="submit" variant="outline">
            + Zona
          </Button>
        </form>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => deleteZone(venueId, zone.id)}
        >
          Eliminar zona
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div>
          <Label>Plano (URL imagen)</Label>
          <Input
            defaultValue={zone.backgroundUrl ?? ""}
            placeholder="https://..."
            onBlur={(e) =>
              updateZone(venueId, zone.id, {
                backgroundUrl: e.target.value || null,
              })
            }
          />
        </div>
      </div>

      <div
        className="relative rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50"
        style={{
          width: zone.layoutWidth,
          height: zone.layoutHeight,
          maxWidth: "100%",
          backgroundImage: zone.backgroundUrl
            ? `url(${zone.backgroundUrl})`
            : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {zone.tables.map((t) => (
          <DraggableTable
            key={t.id}
            table={t}
            selected={selectedTable === t.id}
            onSelect={() => setSelectedTable(t.id)}
            onDragEnd={(x, y) => onDragEnd(t.id, x, y)}
            onDelete={() => deleteTable(venueId, t.id)}
          />
        ))}
      </div>

      {table && (
        <div className="grid gap-3 rounded-lg border p-4 sm:grid-cols-4">
          <p className="font-medium sm:col-span-4">{table.name}</p>
          <div>
            <Label>Ancho</Label>
            <Input
              type="number"
              defaultValue={table.width}
              onBlur={(e) =>
                updateTableDetails(venueId, table.id, {
                  width: Number(e.target.value),
                })
              }
            />
          </div>
          <div>
            <Label>Alto</Label>
            <Input
              type="number"
              defaultValue={table.height}
              onBlur={(e) =>
                updateTableDetails(venueId, table.id, {
                  height: Number(e.target.value),
                })
              }
            />
          </div>
          <div>
            <Label>Rotación</Label>
            <Input
              type="number"
              defaultValue={table.rotation}
              onBlur={(e) =>
                updateTableDetails(venueId, table.id, {
                  rotation: Number(e.target.value),
                })
              }
            />
          </div>
          <div>
            <Label>Forma</Label>
            <select
              defaultValue={table.shape}
              className="h-10 w-full rounded-md border px-2 text-sm"
              onChange={(e) =>
                updateTableDetails(venueId, table.id, { shape: e.target.value })
              }
            >
              <option value="rect">Rectángulo</option>
              <option value="round">Redonda</option>
              <option value="booth">Cabina</option>
            </select>
          </div>
        </div>
      )}

      <form onSubmit={onAddTable} className="flex flex-wrap items-end gap-3">
        <div>
          <Label>Nombre mesa</Label>
          <Input name="name" required placeholder="Mesa 4" />
        </div>
        <div>
          <Label>Mín</Label>
          <Input name="minCapacity" type="number" defaultValue={2} min={1} />
        </div>
        <div>
          <Label>Máx</Label>
          <Input name="maxCapacity" type="number" defaultValue={4} min={1} />
        </div>
        <Button type="submit">Añadir mesa</Button>
      </form>
    </div>
  );
}

function DraggableTable({
  table,
  selected,
  onSelect,
  onDragEnd,
  onDelete,
}: {
  table: TableItem;
  selected: boolean;
  onSelect: () => void;
  onDragEnd: (x: number, y: number) => void;
  onDelete: () => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [pos, setPos] = useState({ x: table.posX, y: table.posY });

  return (
    <div
      draggable
      onDragStart={() => setDragging(true)}
      onDragEnd={(e) => {
        setDragging(false);
        const parent = e.currentTarget.parentElement;
        if (!parent) return;
        const rect = parent.getBoundingClientRect();
        const x = Math.max(0, e.clientX - rect.left - table.width / 2);
        const y = Math.max(0, e.clientY - rect.top - table.height / 2);
        setPos({ x, y });
        onDragEnd(x, y);
      }}
      onClick={onSelect}
      className={`absolute flex cursor-grab flex-col items-center justify-center border-2 bg-white text-xs font-medium shadow-sm active:cursor-grabbing ${table.shape === "round" ? "rounded-full" : "rounded-md"} ${selected ? "border-teal-600 ring-2 ring-teal-300" : "border-zinc-800"} ${dragging ? "opacity-70" : ""}`}
      style={{
        left: pos.x,
        top: pos.y,
        width: table.width,
        height: table.height,
        transform: `rotate(${table.rotation}deg)`,
      }}
    >
      <span>{table.name}</span>
      <span className="text-[10px] text-zinc-500">
        {table.minCapacity}-{table.maxCapacity}
      </span>
      <button
        type="button"
        className="mt-1 text-[10px] text-red-600"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        ×
      </button>
    </div>
  );
}
