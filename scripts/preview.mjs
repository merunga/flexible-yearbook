import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");
const pidFile = path.join(root, ".preview.pid");
const logFile = path.join(root, ".preview.log");
const port = Number(process.env.PORT) || 4321;
const url = `http://localhost:${port}`;

const readPid = () => {
  try {
    const pid = Number(fs.readFileSync(pidFile, "utf8"));
    process.kill(pid, 0);
    return pid;
  } catch {
    fs.rmSync(pidFile, { force: true });
    return null;
  }
};

const up = () => fetch(url).then(() => true, () => false);

function openBrowser() {
  const [cmd, args] =
    process.platform === "darwin" ? ["open", [url]] : process.platform === "win32" ? ["cmd", ["/c", "start", "", url]] : ["xdg-open", [url]];
  spawn(cmd, args, { stdio: "ignore", detached: true }).on("error", () => {}).unref();
}

async function start() {
  if (readPid()) {
    console.log(`ya corriendo: ${url}`);
    return openBrowser();
  }
  if (await up()) return console.log(`el puerto ${port} ya está en uso por otro proceso`), process.exit(1);
  const log = fs.openSync(logFile, "w");
  const child = spawn(process.execPath, ["scripts/serve.mjs"], { cwd: root, detached: true, stdio: ["ignore", log, log], env: { ...process.env, PORT: String(port) } });
  fs.writeFileSync(pidFile, String(child.pid));
  child.unref();
  for (let i = 0; i < 50 && !(await up()); i++) await new Promise((r) => setTimeout(r, 100));
  if (!(await up())) return console.log(`no levantó, ver ${path.relative(root, logFile)}`), process.exit(1);
  console.log(`preview: ${url}`);
  openBrowser();
}

function stop() {
  const pid = readPid();
  if (!pid) return console.log("no estaba corriendo");
  process.kill(pid);
  fs.rmSync(pidFile, { force: true });
  console.log("preview apagado");
}

const cmd = process.argv[2] ?? (readPid() ? "stop" : "start");
if (cmd === "start") await start();
else if (cmd === "stop") stop();
else if (cmd === "status") console.log(readPid() ? `corriendo: ${url}` : "apagado");
else console.log("uso: preview.mjs [start|stop|status]"), process.exit(1);
