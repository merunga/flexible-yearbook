import fs from "node:fs";
import path from "node:path";
import { Marked } from "marked";
import YAML from "yaml";

const root = path.resolve(import.meta.dirname, "..");
const out = path.join(root, "dist");
const srcDir = path.join(root, "proyectos");
const groups = JSON.parse(fs.readFileSync(path.join(root, "src/groups.json"), "utf8"));

const IMG = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);
const VID = new Set([".mp4", ".webm", ".mov", ".m4v"]);
const collator = new Intl.Collator("es", { numeric: true });
const year = new Date().getFullYear();

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const url = (...parts) => parts.map(encodeURIComponent).join("/");

function embedUrl(raw) {
  let u;
  try { u = new URL(raw); } catch { return null; }
  const h = u.hostname.replace(/^www\.|^m\./, "");
  if (h === "youtube.com" && u.searchParams.get("v")) return `https://www.youtube-nocookie.com/embed/${u.searchParams.get("v")}`;
  if (h === "youtube.com" && u.pathname.startsWith("/shorts/")) return `https://www.youtube-nocookie.com/embed/${u.pathname.split("/")[2]}`;
  if (h === "youtu.be") return `https://www.youtube-nocookie.com/embed${u.pathname}`;
  if (h === "vimeo.com" && /^\/\d+/.test(u.pathname)) return `https://player.vimeo.com/video${u.pathname}`;
  if (h === "drive.google.com" && u.pathname.includes("/file/d/")) return raw.replace(/\/(view|edit).*$/, "/preview");
  if (h === "open.spotify.com") return `https://open.spotify.com/embed${u.pathname}`;
  if (h === "scratch.mit.edu" && /^\/projects\/\d+/.test(u.pathname)) return `https://scratch.mit.edu/projects/${u.pathname.split("/")[2]}/embed`;
  return null;
}

const embedHtml = (raw) => {
  const src = embedUrl(raw);
  return src
    ? `<div class="card embed"><iframe src="${esc(src)}" loading="lazy" allowfullscreen allow="autoplay; encrypted-media; picture-in-picture"></iframe></div>`
    : `<p><a href="${esc(raw)}" target="_blank" rel="noopener">${esc(raw)}</a></p>`;
};

const marked = new Marked({
  renderer: {
    paragraph({ tokens, text }) {
      const t = text.trim();
      if (/^https?:\/\/\S+$/.test(t) && embedUrl(t)) return embedHtml(t);
      return `<p>${this.parser.parseInline(tokens)}</p>\n`;
    },
    link({ href, tokens }) {
      const ext = /^https?:/.test(href) ? ' target="_blank" rel="noopener"' : "";
      return `<a href="${esc(href)}"${ext}>${this.parser.parseInline(tokens)}</a>`;
    },
  },
});

function parseMd(file) {
  const raw = fs.readFileSync(file, "utf8");
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  return m ? { meta: YAML.parse(m[1]) ?? {}, body: m[2].trim() } : { meta: {}, body: raw.trim() };
}

function readProject(groupSlug, dir) {
  const abs = path.join(srcDir, groupSlug, dir);
  const files = fs.readdirSync(abs).filter((f) => !f.startsWith(".")).sort(collator.compare);
  const { meta, body } = files.includes("proyecto.md") ? parseMd(path.join(abs, "proyecto.md")) : { meta: {}, body: "" };
  const title = meta.titulo ?? dir.replace(/^\d+[-_ ]*/, "").replace(/[-_]+/g, " ");
  const description = meta.descripcion ?? body.split(/\n\s*\n/)[0].replace(/[#*_>`\[\]]|\(https?:[^)]*\)/g, "").trim();
  const kindOf = (f) => {
    const ext = path.extname(f).toLowerCase();
    return VID.has(ext) ? "video" : IMG.has(ext) ? "image" : null;
  };
  let media = (meta.galeria ?? files).filter(kindOf).map((file) => ({ file, kind: kindOf(file) }));
  for (const m of media) if (!files.includes(m.file)) throw new Error(`${groupSlug}/${dir}: no existe ${m.file}`);
  const cover = meta.portada ?? media.find((m) => /^portada\./i.test(m.file))?.file ?? media.find((m) => m.kind === "image")?.file;
  return {
    slug: dir,
    title: String(title),
    description: String(description),
    date: meta.fecha ? String(meta.fecha) : "",
    order: meta.orden ?? 0,
    html: body ? marked.parse(body) : "",
    links: meta.links ?? [],
    embeds: meta.embeds ?? [],
    media,
    cover,
    abs,
  };
}

function loadGroup(g) {
  const abs = path.join(srcDir, g.slug);
  const dirs = fs.existsSync(abs)
    ? fs.readdirSync(abs, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort(collator.compare)
    : [];
  const projects = dirs.map((d) => readProject(g.slug, d));
  projects.sort((a, b) => a.order - b.order);
  return { ...g, projects };
}

function layout({ title, description, base, body }) {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<link rel="icon" href="${base}favicon.ico">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&display=swap">
<link rel="stylesheet" href="${base}styles.css">
</head>
<body>
<header class="header container"><a href="${base}" class="logo">flexible<span>.</span></a></header>
<main class="container">${body}</main>
<script src="${base}lightbox.js" defer></script>
</body>
</html>
`;
}

const thumb = (src) => (src ? `<img src="${src}" alt="" loading="lazy">` : `<div class="dotted"></div>`);

function homePage(data) {
  const cards = data
    .map((g) => {
      const cover = g.projects.find((p) => p.cover);
      const n = g.projects.length;
      return `<a href="${url(g.slug)}/" class="card lift tone-${g.tone}">
  <div class="thumb">${thumb(cover && url(g.slug, cover.slug, cover.cover))}</div>
  <div class="card-body row"><div><p class="eyebrow-sm">Grupo</p><h2 class="h-card">${esc(g.name)}</h2></div>
  <span class="pill">${n} ${n === 1 ? "proyecto" : "proyectos"}</span></div>
</a>`;
    })
    .join("\n");
  return layout({
    title: "Proyectos del año · Flexible",
    description: "Todo lo que crearon los grupos de Flexible este año: arte, ciencia, juego y tecnología.",
    base: "",
    body: `<section class="hero">
  <p class="eyebrow">Proyectos ${year}</p>
  <h1 class="h-hero">Lo que inventamos, armamos y descubrimos este año.</h1>
  <p class="lead">Elegí el grupo para ver los proyectos de arte, ciencia, juego y tecnología.</p>
</section>
<section class="grid grid-3">${cards}</section>`,
  });
}

function groupPage(g) {
  const list = g.projects.length
    ? `<div class="grid grid-auto mt-10">${g.projects
        .map(
          (p) => `<a href="${url(p.slug)}/" class="card lift bg-card">
  <div class="thumb bg-muted">${thumb(p.cover && url(p.slug, p.cover))}</div>
  <div class="card-body"><h2 class="h-proj">${esc(p.title)}</h2>${p.description ? `<p class="muted clamp-2">${esc(p.description)}</p>` : ""}</div>
</a>`,
        )
        .join("\n")}</div>`
    : `<p class="lead mt-10">Pronto vas a encontrar acá los proyectos de este grupo.</p>`;
  return layout({
    title: `Grupo ${g.name} · Flexible`,
    description: "Proyectos del grupo en Flexible Laboratorio.",
    base: "../",
    body: `<a href="../" class="back">← Todos los grupos</a>
<div class="card badge tone-${g.tone}"><h1 class="h-group">Grupo ${esc(g.name)}</h1></div>
${list}`,
  });
}

function projectPage(g, p) {
  const items = p.media
    .map((m) =>
      m.kind === "video"
        ? `<video src="${url(m.file)}" controls playsinline preload="metadata" class="card media video"></video>`
        : `<a href="${url(m.file)}" class="card media" data-lightbox><img src="${url(m.file)}" alt="" loading="lazy"></a>`,
    )
    .join("\n");
  const links = p.links.length
    ? `<ul class="links">${p.links
        .map((l) => (typeof l === "string" ? { url: l, titulo: l } : l))
        .map((l) => `<li><a href="${esc(l.url)}" target="_blank" rel="noopener" class="pill lift-sm">${esc(l.titulo ?? l.url)} ↗</a></li>`)
        .join("")}</ul>`
    : "";
  const embeds = p.embeds.length ? `<div class="embeds">${p.embeds.map(embedHtml).join("\n")}</div>` : "";
  return layout({
    title: `${p.title} · Flexible`,
    description: p.description.slice(0, 150) || "Un proyecto de Flexible Laboratorio.",
    base: "../../",
    body: `<a href="../" class="back">← Grupo ${esc(g.name)}</a>
${p.date ? `<p class="eyebrow mt-6">${esc(p.date)}</p>` : ""}
<h1 class="h-proj-title">${esc(p.title)}</h1>
${p.html ? `<div class="prose">${p.html}</div>` : ""}
${links}
${embeds}
${items ? `<div class="masonry">${items}</div>` : !p.html && !embeds ? `<p class="muted mt-6">Todavía no hay fotos ni videos.</p>` : ""}`,
  });
}

function write(rel, content) {
  const file = path.join(out, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

fs.rmSync(out, { recursive: true, force: true });
fs.cpSync(path.join(root, "public"), out, { recursive: true });
for (const f of ["styles.css", "lightbox.js"]) fs.copyFileSync(path.join(root, "src", f), path.join(out, f));

const data = groups.map(loadGroup);
write("index.html", homePage(data));
for (const g of data) {
  write(`${g.slug}/index.html`, groupPage(g));
  for (const p of g.projects) {
    write(`${g.slug}/${p.slug}/index.html`, projectPage(g, p));
    for (const f of fs.readdirSync(p.abs))
      if (!f.startsWith(".") && f !== "proyecto.md") fs.cpSync(path.join(p.abs, f), path.join(out, g.slug, p.slug, f), { recursive: true });
  }
}
fs.writeFileSync(path.join(out, ".nojekyll"), "");

console.log(data.map((g) => `${g.slug}: ${g.projects.length} proyectos`).join("\n"));
