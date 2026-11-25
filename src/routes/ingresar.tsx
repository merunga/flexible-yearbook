import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { unlockSite } from "@/lib/gate.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/ingresar")({
  head: () => ({
    meta: [
      { title: "Ingresar · Flexible" },
      { name: "description", content: "Ingreso para familias de Flexible Laboratorio." },
      { property: "og:title", content: "Ingresar · Flexible" },
      { property: "og:description", content: "Ingreso para familias de Flexible Laboratorio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Ingresar,
});

function Ingresar() {
  const router = useRouter();
  const unlock = useServerFn(unlockSite);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const password = String(new FormData(e.currentTarget).get("password") ?? "");
    const { ok } = await unlock({ data: { password } });
    setBusy(false);
    if (ok) await router.navigate({ to: "/" });
    else setError(true);
  }

  return (
    <main className="dotted-bg flex min-h-screen items-center justify-center px-5">
      <div className="block-card w-full max-w-md bg-card p-8">
        <div className="mb-6 flex gap-2">
          <span className="size-4 rounded-full border-2 border-ink bg-sun" />
          <span className="size-4 rounded-full border-2 border-ink bg-mint" />
          <span className="size-4 rounded-full border-2 border-ink bg-sky" />
        </div>
        <h1 className="text-4xl font-extrabold">
          flexible<span className="text-primary">.</span>
        </h1>
        <p className="mt-2 text-muted-foreground">
          Laboratorio de arte, ciencia, juego y tecnología. Ingresá con la clave para ver los proyectos del año.
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <label htmlFor="password" className="text-sm font-bold">Clave de familias</label>
          <Input id="password" name="password" type="password" autoComplete="current-password" required className="h-12 border-2 border-ink bg-background" />
          {error && <p className="text-sm text-destructive">Esa clave no es correcta. Probá de nuevo.</p>}
          <Button type="submit" variant="block" size="lg" className="w-full" disabled={busy}>
            {busy ? "Entrando…" : "Entrar"}
          </Button>
        </form>
      </div>
    </main>
  );
}
