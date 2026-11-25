import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { redirect, notFound } from "@tanstack/react-router";
import { createHash, timingSafeEqual } from "node:crypto";

type GateSession = { unlocked?: boolean };

function sessionConfig() {
  return {
    password: process.env["SESSION_SECRET"]!,
    name: "flexible-familias",
    maxAge: 60 * 60 * 24 * 30,
    cookie: { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/" },
  };
}

function passwordMatches(input: string, expected: string) {
  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

async function requireUnlocked() {
  const session = await useSession<GateSession>(sessionConfig());
  if (!session.data.unlocked) throw redirect({ to: "/ingresar" });
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function sign(paths: string[]) {
  const unique = [...new Set(paths.filter(Boolean))];
  if (!unique.length) return {} as Record<string, string>;
  const sb = await admin();
  const { data } = await sb.storage.from("media").createSignedUrls(unique, 60 * 60 * 6);
  const map: Record<string, string> = {};
  for (const d of data ?? []) if (d.path && d.signedUrl) map[d.path] = d.signedUrl;
  return map;
}

export const unlockSite = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string }) => ({ password: String(d.password ?? "").slice(0, 200) }))
  .handler(async ({ data }) => {
    const expected = process.env["SITE_PASSWORD"];
    if (!expected) throw new Error("SITE_PASSWORD no está configurada");
    if (!passwordMatches(data.password.trim(), expected)) return { ok: false as const };
    const session = await useSession<GateSession>(sessionConfig());
    await session.update({ unlocked: true });
    return { ok: true as const };
  });

export const lockSite = createServerFn({ method: "POST" }).handler(async () => {
  const session = await useSession<GateSession>(sessionConfig());
  await session.clear();
  return { ok: true as const };
});

export const getOverview = createServerFn({ method: "GET" }).handler(async () => {
  await requireUnlocked();
  const sb = await admin();
  const { data } = await sb.from("projects").select("id, group_slug, cover_path").order("created_at", { ascending: false });
  const counts: Record<string, number> = {};
  const covers: Record<string, string> = {};
  for (const p of data ?? []) {
    counts[p.group_slug] = (counts[p.group_slug] ?? 0) + 1;
    if (!covers[p.group_slug] && p.cover_path) covers[p.group_slug] = p.cover_path;
  }
  const urls = await sign(Object.values(covers));
  const coverUrls: Record<string, string> = {};
  for (const [g, path] of Object.entries(covers)) if (urls[path]) coverUrls[g] = urls[path];
  return { counts, coverUrls };
});

export const getGroupProjects = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => ({ slug: String(d.slug) }))
  .handler(async ({ data }) => {
    await requireUnlocked();
    const sb = await admin();
    const { data: rows } = await sb
      .from("projects")
      .select("id, title, description, cover_path")
      .eq("group_slug", data.slug)
      .order("created_at", { ascending: false });
    const urls = await sign((rows ?? []).map((r) => r.cover_path ?? ""));
    return (rows ?? []).map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      coverUrl: r.cover_path ? (urls[r.cover_path] ?? null) : null,
    }));
  });

export const getProject = createServerFn({ method: "GET" })
  .inputValidator((d: { id: string }) => ({ id: String(d.id) }))
  .handler(async ({ data }) => {
    await requireUnlocked();
    if (!/^[0-9a-f-]{36}$/i.test(data.id)) throw notFound();
    const sb = await admin();
    const { data: project } = await sb
      .from("projects")
      .select("id, title, description, group_slug")
      .eq("id", data.id)
      .maybeSingle();
    if (!project) throw notFound();
    const { data: media } = await sb
      .from("media")
      .select("id, path, kind")
      .eq("project_id", data.id)
      .order("position")
      .order("created_at");
    const urls = await sign((media ?? []).map((m) => m.path));
    return {
      ...project,
      media: (media ?? []).map((m) => ({ id: m.id, kind: m.kind, url: urls[m.path] ?? "" })).filter((m) => m.url),
    };
  });
