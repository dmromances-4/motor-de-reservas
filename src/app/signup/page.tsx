"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wordmark } from "@/components/ui/wordmark";

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const payload = {
      name: form.get("name"),
      email: form.get("email"),
      password: form.get("password"),
      venueName: form.get("venueName"),
    };

    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error al registrarse");
      setLoading(false);
      return;
    }

    await signIn("credentials", {
      email: payload.email,
      password: payload.password,
      redirect: false,
    });

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="animate-rise w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <Wordmark />
          </Link>
        </div>
        <div
          className="shadow-soft rounded-3xl px-8 py-8"
          style={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--line)",
          }}
        >
          <h1
            className="font-display text-2xl font-semibold"
            style={{ color: "var(--ink)" }}
          >
            Crear cuenta
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            Empieza a recibir reservas directas hoy.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="space-y-1.5">
              <Label htmlFor="name">Tu nombre</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="venueName">Nombre del local</Label>
              <Input id="venueName" name="venueName" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                minLength={8}
                required
              />
            </div>
            <Button className="w-full" disabled={loading}>
              {loading ? "Creando..." : "Crear cuenta"}
            </Button>
          </form>
          <p className="mt-5 text-center text-sm" style={{ color: "var(--muted)" }}>
            ¿Ya tienes cuenta?{" "}
            <Link
              href="/login"
              className="font-semibold"
              style={{ color: "var(--teal-deep)" }}
            >
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
