import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");
const dist = path.join(root, "dist");
const port = Number(process.env.PORT) || 4321;
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".m4v": "video/mp4",
};

function build() {
  try {
    execFileSync(process.execPath, ["scripts/build.mjs"], { cwd: root, stdio: "inherit" });
  } catch {
    console.error("build falló");
  }
}

build();

let timer;
for (const dir of ["proyectos", "src", "public", "scripts"])
  fs.watch(path.join(root, dir), { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(build, 150);
  });

http
  .createServer((req, res) => {
    let file = path.join(dist, decodeURIComponent(new URL(req.url, "http://x").pathname));
    if (!file.startsWith(dist)) return res.writeHead(403).end();
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
    if (!fs.existsSync(file)) return res.writeHead(404).end("404");
    const { size } = fs.statSync(file);
    const type = types[path.extname(file).toLowerCase()] ?? "application/octet-stream";
    const range = req.headers.range?.match(/bytes=(\d*)-(\d*)/);
    if (range) {
      const start = range[1] ? Number(range[1]) : 0;
      const end = range[2] ? Number(range[2]) : size - 1;
      res.writeHead(206, { "Content-Type": type, "Content-Range": `bytes ${start}-${end}/${size}`, "Accept-Ranges": "bytes", "Content-Length": end - start + 1 });
      return fs.createReadStream(file, { start, end }).pipe(res);
    }
    res.writeHead(200, { "Content-Type": type, "Content-Length": size, "Accept-Ranges": "bytes", "Cache-Control": "no-store" });
    fs.createReadStream(file).pipe(res);
  })
  .listen(port, () => console.log(`http://localhost:${port}`));
