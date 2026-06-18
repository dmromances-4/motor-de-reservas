"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  connectPos,
  disconnectPos,
  testPosConnection,
} from "@/app/actions/integrations";

type PosIntegrationInfo = {
  provider: "SQUARE" | "HOLDED";
  status: string;
  lastSyncAt: string | null;
};

export function IntegrationConnectModal({
  venueId,
  open,
  provider,
  integration,
  onClose,
}: {
  venueId: string;
  open: boolean;
  provider: "SQUARE" | "HOLDED" | null;
  integration: PosIntegrationInfo | null;
  onClose: () => void;
}) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open || !provider) return null;

  const title = provider === "SQUARE" ? "Square" : "Holded";

  async function handleConnect(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const form = new FormData(e.currentTarget);
    try {
      if (provider === "SQUARE") {
        await connectPos(venueId, "SQUARE", {
          accessToken: String(form.get("accessToken")),
          locationId: String(form.get("locationId")),
        });
      } else {
        await connectPos(venueId, "HOLDED", {
          apiKey: String(form.get("apiKey")),
        });
      }
      setMessage("Conexión guardada");
    } catch {
      setMessage("Error al conectar");
    }
    setLoading(false);
  }

  async function handleTest() {
    setLoading(true);
    const result = await testPosConnection(venueId, provider!);
    setMessage(result.ok ? "Conexión OK" : "Error de conexión");
    setLoading(false);
  }

  async function handleDisconnect() {
    setLoading(true);
    await disconnectPos(venueId, provider!);
    setMessage("Desconectado");
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Configurar {title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700"
          >
            ✕
          </button>
        </div>

        {integration && (
          <p className="mb-4 text-sm text-zinc-500">
            Estado: {integration.status}
            {integration.lastSyncAt &&
              ` · Último sync: ${new Date(integration.lastSyncAt).toLocaleString("es-ES")}`}
          </p>
        )}

        <form onSubmit={handleConnect} className="space-y-3">
          {provider === "SQUARE" ? (
            <>
              <div>
                <Label>Access token</Label>
                <Input name="accessToken" type="password" placeholder="sq0atp-..." required />
              </div>
              <div>
                <Label>Location ID</Label>
                <Input name="locationId" placeholder="L..." required />
              </div>
            </>
          ) : (
            <div>
              <Label>API Key</Label>
              <Input name="apiKey" type="password" placeholder="holded_..." required />
            </div>
          )}

          {message && <p className="text-sm text-emerald-700">{message}</p>}

          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="submit" disabled={loading}>
              Conectar
            </Button>
            {integration?.status === "CONNECTED" && (
              <>
                <Button type="button" variant="outline" onClick={handleTest} disabled={loading}>
                  Probar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDisconnect}
                  disabled={loading}
                >
                  Desconectar
                </Button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
