import { Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { lockSite } from "@/lib/gate.functions";

export function Logo() {
  return (
    <Link to="/" className="font-display text-2xl font-extrabold tracking-tight">
      flexible<span className="text-primary">.</span>
    </Link>
  );
}

export function SiteHeader() {
  const router = useRouter();
  const lock = useServerFn(lockSite);
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
      <Logo />
      <button
        onClick={async () => {
          await lock();
          await router.navigate({ to: "/ingresar" });
        }}
        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        Salir
      </button>
    </header>
  );
}
