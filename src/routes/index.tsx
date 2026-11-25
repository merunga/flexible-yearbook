import { createFileRoute, Link } from "@tanstack/react-router";
import { getOverview } from "@/lib/gate.functions";
import { GROUPS, toneClass } from "@/lib/groups";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/")({
  loader: () => getOverview(),
  head: () => ({
    meta: [
      { title: "Proyectos del año · Flexible" },
      { name: "description", content: "Todo lo que crearon los grupos de Flexible este año: arte, ciencia, juego y tecnología." },
      { property: "og:title", content: "Proyectos del año · Flexible" },
      { property: "og:description", content: "Todo lo que crearon los grupos de Flexible este año." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { counts, coverUrls } = Route.useLoaderData();
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 pb-20">
        <section className="py-10 md:py-16">
          <p className="font-bold uppercase tracking-widest text-primary">Proyectos {new Date().getFullYear()}</p>
          <h1 className="mt-3 max-w-3xl text-5xl font-extrabold leading-[0.95] md:text-7xl">
            Lo que inventamos, armamos y descubrimos este año.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            Elegí el grupo para ver los proyectos de arte, ciencia, juego y tecnología.
          </p>
        </section>
        <section className="grid gap-6 md:grid-cols-3">
          {GROUPS.map((g) => (
            <Link
              key={g.slug}
              to="/grupo/$slug"
              params={{ slug: g.slug }}
              className={`block-card block-lift group overflow-hidden ${toneClass[g.tone]}`}
            >
              <div className="aspect-[4/3] border-b-2 border-ink bg-card/40">
                {coverUrls[g.slug] ? (
                  <img src={coverUrls[g.slug]} alt="" className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="dotted-bg h-full w-full" />
                )}
              </div>
              <div className="flex items-end justify-between p-5">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wider">Grupo</p>
                  <h2 className="text-3xl font-extrabold">{g.name}</h2>
                </div>
                <span className="rounded-full border-2 border-ink bg-card px-3 py-1 text-sm font-bold">
                  {counts[g.slug] ?? 0} proyectos
                </span>
              </div>
            </Link>
          ))}
        </section>
      </main>
    </div>
  );
}
