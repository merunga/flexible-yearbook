import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { uploadMedia } from "@/lib/upload";
import { GROUPS, toneClass } from "@/lib/groups";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/admin/$id")({ component: EditProject });

function EditProject() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-project", id],
    queryFn: async () => {
      const [{ data: project, error }, { data: media }] = await Promise.all([
        supabase.from("projects").select("*").eq("id", id).single(),
        supabase.from("media").select("*").eq("project_id", id).order("position").order("created_at"),
      ]);
      if (error) throw error;
      const paths = (media ?? []).map((m) => m.path);
      const { data: signed } = paths.length ? await supabase.storage.from("media").createSignedUrls(paths, 3600) : { data: [] };
      const urls = Object.fromEntries((signed ?? []).map((s) => [s.path, s.signedUrl]));
      return { project, media: (media ?? []).map((m) => ({ ...m, url: urls[m.path] as string | undefined })) };
    },
  });

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [group, setGroup] = useState("");
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  useEffect(() => {
    if (data?.project) {
      setTitle(data.project.title);
      setDescription(data.project.description);
      setGroup(data.project.group_slug);
    }
  }, [data?.project]);

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-project", id] });

  async function save() {
    const { error } = await supabase.from("projects").update({ title, description, group_slug: group }).eq("id", id);
    if (error) toast.error("No se pudo guardar");
    else toast.success("Guardado");
    qc.invalidateQueries({ queryKey: ["admin-projects"] });
  }

  async function onFiles(files: FileList | null) {
    if (!files?.length || !data) return;
    const list = Array.from(files);
    setProgress({ done: 0, total: list.length });
    let position = data.media.length;
    let cover = data.project.cover_path;
    let failed = 0;
    for (const file of list) {
      try {
        const up = await uploadMedia(id, file);
        await supabase.from("media").insert({ project_id: id, path: up.path, kind: up.kind, position: position++ });
        if (!cover && up.kind === "image") {
          cover = up.path;
          await supabase.from("projects").update({ cover_path: cover }).eq("id", id);
        }
      } catch {
        failed++;
      }
      setProgress((p) => (p ? { ...p, done: p.done + 1 } : p));
    }
    setProgress(null);
    if (failed) toast.error(`${failed} archivo(s) no se pudieron subir (máx. 200 MB cada uno)`);
    else toast.success("Archivos subidos");
    refresh();
  }

  async function removeMedia(m: { id: string; path: string }) {
    await supabase.storage.from("media").remove([m.path]);
    await supabase.from("media").delete().eq("id", m.id);
    if (data?.project.cover_path === m.path) {
      const next = data.media.find((x) => x.id !== m.id && x.kind === "image");
      await supabase.from("projects").update({ cover_path: next?.path ?? null }).eq("id", id);
    }
    refresh();
  }

  async function setCover(path: string) {
    await supabase.from("projects").update({ cover_path: path }).eq("id", id);
    toast.success("Portada actualizada");
    refresh();
  }

  async function removeProject() {
    if (!data || !confirm("¿Borrar este proyecto y todos sus archivos?")) return;
    if (data.media.length) await supabase.storage.from("media").remove(data.media.map((m) => m.path));
    await supabase.from("projects").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-projects"] });
    navigate({ to: "/admin" });
  }

  if (!data) return <p className="text-muted-foreground">Cargando…</p>;

  return (
    <div className="space-y-8">
      <section className="block-card space-y-4 bg-card p-6">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-12 border-2 border-ink font-display text-2xl font-extrabold" />
        <div className="flex flex-wrap gap-2">
          {GROUPS.map((g) => (
            <button key={g.slug} type="button" onClick={() => setGroup(g.slug)} className={`rounded-full border-2 border-ink px-4 py-1.5 text-sm font-bold ${group === g.slug ? toneClass[g.tone] : "bg-card"}`}>
              {g.name}
            </button>
          ))}
        </div>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Contá de qué se trató el proyecto…" rows={4} className="border-2 border-ink" />
        <div className="flex justify-between">
          <Button variant="block" onClick={save}>Guardar cambios</Button>
          <Button variant="ghost" className="text-destructive" onClick={removeProject}>Borrar proyecto</Button>
        </div>
      </section>

      <section className="block-card bg-card p-6">
        <h2 className="text-2xl font-extrabold">Fotos y videos</h2>
        <p className="text-sm text-muted-foreground">Podés elegir muchos archivos a la vez. Las fotos se achican solas; los videos hasta 200 MB.</p>
        <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-ink bg-secondary px-6 py-10 text-center font-bold hover:bg-accent">
          {progress ? `Subiendo ${progress.done} de ${progress.total}…` : "+ Elegir fotos y videos"}
          <input type="file" multiple accept="image/*,video/*" className="hidden" disabled={!!progress} onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }} />
        </label>
        {progress && <Progress value={(progress.done / progress.total) * 100} className="mt-3" />}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {data.media.map((m) => (
            <div key={m.id} className="overflow-hidden rounded-xl border-2 border-ink bg-muted">
              {m.kind === "video" ? (
                <video src={m.url} className="aspect-square w-full object-cover" muted playsInline />
              ) : (
                <img src={m.url} alt="" className="aspect-square w-full object-cover" loading="lazy" />
              )}
              <div className="flex justify-between gap-1 border-t-2 border-ink bg-card p-1.5 text-xs font-bold">
                {m.kind === "image" ? (
                  data.project.cover_path === m.path ? <span className="px-1 text-primary">Portada</span> : <button onClick={() => setCover(m.path)} className="px-1 hover:underline">Usar de portada</button>
                ) : <span className="px-1">Video</span>}
                <button onClick={() => removeMedia(m)} className="px-1 text-destructive hover:underline">Quitar</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
