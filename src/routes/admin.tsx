import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Panel · Flexible" },
      { name: "description", content: "Panel para cargar los proyectos de Flexible." },
      { property: "og:title", content: "Panel · Flexible" },
      { property: "og:description", content: "Panel para cargar los proyectos de Flexible." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  if (!ready) return null;
  if (!session) return <Login />;
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
        <Link to="/admin" className="font-display text-2xl font-extrabold">
          flexible<span className="text-primary">.</span> <span className="text-base font-bold text-muted-foreground">panel</span>
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link to="/" className="underline-offset-4 hover:underline">Ver sitio</Link>
          <button onClick={() => supabase.auth.signOut()} className="text-muted-foreground underline-offset-4 hover:underline">Cerrar sesión</button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 pb-20">
        <Outlet />
      </main>
    </div>
  );
}

function Login() {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(f.get("email")),
      password: String(f.get("password")),
    });
    setBusy(false);
    if (error) setError("Email o contraseña incorrectos.");
  }
  return (
    <main className="dotted-bg flex min-h-screen items-center justify-center px-5">
      <form onSubmit={onSubmit} className="block-card w-full max-w-md space-y-3 bg-card p-8">
        <h1 className="text-3xl font-extrabold">Panel del equipo</h1>
        <p className="text-muted-foreground">Ingresá para cargar proyectos.</p>
        <Input name="email" type="email" placeholder="Email" required autoComplete="email" className="h-12 border-2 border-ink" />
        <Input name="password" type="password" placeholder="Contraseña" required autoComplete="current-password" className="h-12 border-2 border-ink" />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" variant="block" size="lg" className="w-full" disabled={busy}>Entrar</Button>
      </form>
    </main>
  );
}
