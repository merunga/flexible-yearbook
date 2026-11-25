import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getGroupProjects } from "@/lib/gate.functions";
import { findGroup, toneClass } from "@/lib/groups";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/grupo/$slug")({
  loader: async ({ params }) => {
    const group = findGroup(params.slug);
    if (!group) throw notFound();
    const projects = await getGroupProjects({ data: { slug: params.slug } });
    return { group, projects };
  },
  head: ({ loaderData }) => {
    const title = loaderData ? `Grupo ${loaderData.group.name} · Flexible` : "Grupo · Flexible";
    return {
      meta: [
        { title },
        { name: "description", content: "Proyectos del grupo en Flexible Laboratorio." },
        { property: "og:title", content: title },
        { property: "og:description", content: "Proyectos del grupo en Flexible Laboratorio." },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: Grupo,
});

function Grupo() {
  const { group, projects } = Route.useLoaderData();
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 pb-20">
        <Link to="/" className="text-sm font-bold underline-offset-4 hover:underline">← Todos los grupos</Link>
        <div className={`block-card mt-4 inline-block px-5 py-3 ${toneClass[group.tone]}`}>
          <h1 className="text-4xl font-extrabold md:text-5xl">Grupo {group.name}</h1>
        </div>
        {projects.length === 0 ? (
          <p className="mt-10 text-lg text-muted-foreground">Pronto vas a encontrar acá los proyectos de este grupo.</p>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <Link key={p.id} to="/proyecto/$id" params={{ id: p.id }} className="block-card block-lift overflow-hidden bg-card">
                <div className="aspect-[4/3] border-b-2 border-ink bg-muted">
                  {p.coverUrl ? <img src={p.coverUrl} alt="" loading="lazy" className="h-full w-full object-cover" /> : <div className="dotted-bg h-full w-full" />}
                </div>
                <div className="p-5">
                  <h2 className="text-2xl font-extrabold">{p.title}</h2>
                  {p.description && <p className="mt-1 line-clamp-2 text-muted-foreground">{p.description}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
