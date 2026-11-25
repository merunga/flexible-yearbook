import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const dist = path.join(root, "dist");
const groups = JSON.parse(fs.readFileSync(path.join(root, "src/groups.json"), "utf8"));

execFileSync(process.execPath, ["scripts/build.mjs"], { cwd: root, stdio: "pipe" });

const htmlFiles = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    return d.isDirectory() ? htmlFiles(p) : d.name.endsWith(".html") ? [p] : [];
  });

const projectDirs = groups.flatMap((g) => {
  const dir = path.join(root, "proyectos", g.slug);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => `${g.slug}/${d.name}`);
});

test("genera home y una página por grupo", () => {
  assert.ok(fs.existsSync(path.join(dist, "index.html")));
  for (const g of groups) assert.ok(fs.existsSync(path.join(dist, g.slug, "index.html")), g.slug);
});

test("genera una página por proyecto", () => {
  for (const p of projectDirs) assert.ok(fs.existsSync(path.join(dist, p, "index.html")), p);
});

test("todos los href/src locales existen en dist", () => {
  const missing = [];
  for (const file of htmlFiles(dist)) {
    const html = fs.readFileSync(file, "utf8");
    for (const [, ref] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (/^(https?:|mailto:|#|data:)/.test(ref)) continue;
      let target = path.resolve(path.dirname(file), decodeURIComponent(ref.split(/[?#]/)[0]));
      if (ref.endsWith("/") || ref === "") target = path.join(target, "index.html");
      if (!fs.existsSync(target)) missing.push(`${path.relative(dist, file)} → ${ref}`);
    }
  }
  assert.deepEqual(missing, []);
});

test("sin valores sin resolver en el HTML", () => {
  for (const file of htmlFiles(dist)) {
    const html = fs.readFileSync(file, "utf8");
    assert.doesNotMatch(html, /undefined|\[object Object\]|NaN/, path.relative(dist, file));
  }
});
