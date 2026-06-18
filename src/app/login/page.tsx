"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getSession, signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wordmark } from "@/components/ui/wordmark";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      email: form.get("email"),
      password: form.get("password"),
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError("Credenciales incorrectas");
      return;
    }
    const session = await getSession();
    router.push(session?.user?.accountType === "DINER" ? "/account" : "/dashboard");
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
            Iniciar sesión
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            Accede a tu panel de operaciones.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <Button className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
          <p className="mt-5 text-center text-sm" style={{ color: "var(--muted)" }}>
            ¿No tienes cuenta?{" "}
            <Link
              href="/signup"
              className="font-semibold"
              style={{ color: "var(--teal-deep)" }}
            >
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
