"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  connectChannelIntegration,
  connectGooglePlace,
  disconnectChannelIntegration,
  syncGoogleProfile,
} from "@/app/actions/integrations";

type ChannelModalProps = {
  venueId: string;
  open: boolean;
  provider: string | null;
  title: string;
  connected: boolean;
  onClose: () => void;
};

export function IntegrationChannelModal({
  venueId,
  open,
  provider,
  title,
  connected,
  onClose,
}: ChannelModalProps) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open || !provider) return null;

  const activeProvider = provider;
  const isGoogle = activeProvider === "google_business";

  async function handleConnect(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const form = new FormData(e.currentTarget);

    if (isGoogle) {
      const placeId = String(form.get("placeId"));
      const result = await connectGooglePlace(venueId, placeId);
      setMessage(result.ok ? "Perfil importado desde Google" : result.error ?? "Error");
    } else {
      await connectChannelIntegration(venueId, activeProvider, {
        externalId: String(form.get("externalId") || ""),
        apiKey: String(form.get("apiKey") || ""),
      });
      setMessage("Conexión guardada");
    }
    setLoading(false);
  }

  async function handleSync() {
    setLoading(true);
    const result = await syncGoogleProfile(venueId);
    setMessage(result.ok ? "Sincronizado" : result.error ?? "Error");
    setLoading(false);
  }

  async function handleDisconnect() {
    setLoading(true);
    await disconnectChannelIntegration(venueId, activeProvider);
    setMessage("Desconectado");
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button type="button" onClick={onClose} className="text-zinc-500">
            ×
          </button>
        </div>

        {message && <p className="mb-3 text-sm text-emerald-700">{message}</p>}

        <form onSubmit={handleConnect} className="space-y-3">
          {isGoogle ? (
            <div>
              <Label>Google Place ID</Label>
              <Input name="placeId" required placeholder="ChIJ..." />
              <p className="mt-1 text-xs text-zinc-500">
                Importa horarios, fotos y datos desde Places API. OAuth Business Profile pendiente de alta.
              </p>
            </div>
          ) : (
            <>
              <div>
                <Label>ID externo</Label>
                <Input name="externalId" placeholder="restaurant-id" />
              </div>
              <div>
                <Label>API key / token</Label>
                <Input name="apiKey" type="password" placeholder="••••••" />
              </div>
            </>
          )}
          <Button type="submit" disabled={loading}>
            {connected ? "Actualizar" : "Conectar"}
          </Button>
        </form>

        {connected && isGoogle && (
          <Button
            type="button"
            variant="outline"
            className="mt-3 w-full"
            disabled={loading}
            onClick={handleSync}
          >
            Sincronizar perfil
          </Button>
        )}

        {connected && (
          <Button
            type="button"
            variant="ghost"
            className="mt-2 w-full text-red-600"
            disabled={loading}
            onClick={handleDisconnect}
          >
            Desconectar
          </Button>
        )}
      </div>
    </div>
  );
}
