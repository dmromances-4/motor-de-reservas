"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AccountSignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const referralFromUrl = searchParams.get("ref") ?? "";
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const body = {
      name: form.get("name"),
      email: form.get("email"),
      password: form.get("password"),
      referralCode: form.get("referralCode") || referralFromUrl || undefined,
    };

    const res = await fetch("/api/account/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error al registrarse");
      setLoading(false);
      return;
    }

    await signIn("credentials", {
      email: body.email,
      password: body.password,
      redirect: false,
    });
    setLoading(false);
    router.push("/account");
    router.refresh();
  }

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle>Crear cuenta de comensal</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div>
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" name="name" required />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div>
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" name="password" type="password" minLength={8} required />
          </div>
          <div>
            <Label htmlFor="referralCode">Código de referido (opcional)</Label>
            <Input
              id="referralCode"
              name="referralCode"
              defaultValue={referralFromUrl}
              placeholder="REF-..."
            />
          </div>
          <Button className="w-full" disabled={loading}>
            {loading ? "Creando cuenta..." : "Registrarse"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-zinc-500">
          ¿Ya tienes cuenta?{" "}
          <Link href="/account/login" className="font-medium text-zinc-900">
            Entrar
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
