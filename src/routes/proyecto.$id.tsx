import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { getProject } from "@/lib/gate.functions";
import { findGroup } from "@/lib/groups";
import { SiteHeader } from "@/components/SiteHeader";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/proyecto/$id")({
  loader: ({ params }) => getProject({ data: { id: params.id } }),
  head: ({ loaderData }) => {
    const title = loaderData ? `${loaderData.title} · Flexible` : "Proyecto · Flexible";
    const desc = loaderData?.description?.slice(0, 150) || "Un proyecto de Flexible Laboratorio.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: Proyecto,
});

function Proyecto() {
  const p = Route.useLoaderData();
  const group = findGroup(p.group_slug);
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 pb-20">
        {group && (
          <Link to="/grupo/$slug" params={{ slug: group.slug }} className="text-sm font-bold underline-offset-4 hover:underline">
            ← Grupo {group.name}
          </Link>
        )}
        <h1 className="mt-4 max-w-3xl text-5xl font-extrabold leading-tight">{p.title}</h1>
        {p.description && <p className="mt-4 max-w-2xl whitespace-pre-line text-lg text-muted-foreground">{p.description}</p>}
        <div className="mt-10 columns-1 gap-5 sm:columns-2 lg:columns-3">
          {p.media.map((m) =>
            m.kind === "video" ? (
              <video key={m.id} src={m.url} controls playsInline preload="metadata" className="block-card mb-5 w-full break-inside-avoid bg-ink" />
            ) : (
              <button key={m.id} onClick={() => setOpen(m.url)} className="block-card mb-5 block w-full break-inside-avoid overflow-hidden">
                <img src={m.url} alt="" loading="lazy" className="w-full" />
              </button>
            ),
          )}
        </div>
        {p.media.length === 0 && <p className="mt-6 text-muted-foreground">Todavía no hay fotos ni videos.</p>}
      </main>
      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-5xl border-2 border-ink p-2">
          <DialogTitle className="sr-only">Foto</DialogTitle>
          {open && <img src={open} alt="" className="max-h-[85vh] w-full rounded-md object-contain" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
