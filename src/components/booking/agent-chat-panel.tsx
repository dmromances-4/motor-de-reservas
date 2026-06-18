"use client";

import { useCallback, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export function AgentChatPanel({
  slug,
  venueName,
  primaryColor,
}: {
  slug: string;
  venueName: string;
  primaryColor: string;
}) {
  const sessionKey = useId();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setError("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setLoading(true);

    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          message: text,
          conversationId,
          sessionKey,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al enviar");
        return;
      }

      setConversationId(data.conversationId);
      setMessages((m) => [
        ...m,
        { role: "assistant", content: data.reply },
      ]);
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }, [conversationId, input, loading, sessionKey, slug]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 rounded-full px-4 py-3 text-sm font-medium text-white shadow-lg"
        style={{ backgroundColor: primaryColor }}
      >
        Hablar con asistente
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex h-[420px] w-[min(100vw-2rem,360px)] flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl">
      <div
        className="flex items-center justify-between px-4 py-3 text-white"
        style={{ backgroundColor: primaryColor }}
      >
        <span className="text-sm font-medium">Asistente · {venueName}</span>
        <button
          type="button"
          className="text-white/90 hover:text-white"
          onClick={() => setOpen(false)}
          aria-label="Cerrar chat"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="text-sm text-zinc-500">
            Pregunta por disponibilidad o haz tu reserva por chat.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
              m.role === "user"
                ? "ml-auto bg-zinc-900 text-white"
                : "bg-zinc-100 text-zinc-800"
            }`}
          >
            {m.content}
          </div>
        ))}
        {loading && (
          <p className="text-xs text-zinc-400">Escribiendo…</p>
        )}
      </div>

      {error && (
        <p className="px-4 text-xs text-red-600">{error}</p>
      )}

      <form
        className="flex gap-2 border-t border-zinc-100 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu mensaje…"
          disabled={loading}
          className="flex-1"
        />
        <Button type="submit" disabled={loading || !input.trim()}>
          Enviar
        </Button>
      </form>
    </div>
  );
}
