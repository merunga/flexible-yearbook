import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { GROUPS, findGroup, toneClass } from "@/lib/groups";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/admin/")({ component: AdminHome });

function AdminHome() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [group, setGroup] = useState<string>(GROUPS[0].slug);
  const { data: projects = [] } = useQuery({
    queryKey: ["admin-projects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("id, title, group_slug, created_at").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function create(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const title = String(new FormData(e.currentTarget).get("title") ?? "").trim();
    if (!title) return;
    const { data, error } = await supabase.from("projects").insert({ title, group_slug: group }).select("id").single();
    if (error) {
      toast.error("No se pudo crear el proyecto");
      return;
    }
    qc.invalidateQueries({ queryKey: ["admin-projects"] });
    navigate({ to: "/admin/$id", params: { id: data.id } });
  }

  return (
    <div>
      <form onSubmit={create} className="block-card bg-card p-6">
        <h1 className="text-3xl font-extrabold">Nuevo proyecto</h1>
        <div className="mt-4 flex flex-wrap gap-2">
          {GROUPS.map((g) => (
            <button
              type="button"
              key={g.slug}
              onClick={() => setGroup(g.slug)}
              className={`rounded-full border-2 border-ink px-4 py-1.5 text-sm font-bold ${group === g.slug ? toneClass[g.tone] : "bg-card"}`}
            >
              {g.name}
            </button>
          ))}
        </div>
        <div className="mt-4 flex gap-3">
          <Input name="title" placeholder="Nombre del proyecto" required className="h-11 border-2 border-ink" />
          <Button type="submit" variant="block" className="h-11">Crear</Button>
        </div>
      </form>

      <h2 className="mt-10 text-2xl font-extrabold">Proyectos cargados ({projects.length})</h2>
      <ul className="mt-4 space-y-3">
        {projects.map((p) => {
          const g = findGroup(p.group_slug);
          return (
            <li key={p.id}>
              <Link to="/admin/$id" params={{ id: p.id }} className="block-card block-lift flex items-center justify-between bg-card px-5 py-4">
                <span className="font-bold">{p.title}</span>
                {g && <span className={`rounded-full border-2 border-ink px-3 py-0.5 text-xs font-bold ${toneClass[g.tone]}`}>{g.name}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
