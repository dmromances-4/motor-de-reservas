"use client";

import { Input } from "@/components/ui/input";
import {
  CATEGORY_ORDER,
  INTEGRATION_CATEGORIES,
  type IntegrationCategory,
} from "@/domain/integrations/catalog";
import { cn } from "@/lib/utils";

export function IntegrationsFilterBar({
  search,
  category,
  onSearchChange,
  onCategoryChange,
}: {
  search: string;
  category: IntegrationCategory | "all";
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: IntegrationCategory | "all") => void;
}) {
  return (
    <div className="space-y-3">
      <Input
        placeholder="Buscar integración..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="max-w-md"
      />
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => onCategoryChange("all")}
          className={cn(
            "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
            category === "all"
              ? "bg-zinc-900 text-white"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200",
          )}
        >
          Todas
        </button>
        {CATEGORY_ORDER.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => onCategoryChange(cat)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              category === cat
                ? "bg-zinc-900 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200",
            )}
          >
            {INTEGRATION_CATEGORIES[cat].title}
          </button>
        ))}
      </div>
    </div>
  );
}
