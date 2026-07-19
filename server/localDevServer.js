import { createServer as createHttpServer } from "node:http";
import { pathToFileURL } from "node:url";
import { createServer as createViteServer } from "vite";
import aiHandler from "../api/ai.js";

const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 5173;
const MAX_JSON_BODY_BYTES = 64 * 1024;

function sendJson(res, statusCode, payload) {
  if (res.writableEnded) return;
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, { "content-type": "application/json; charset=utf-8", "content-length": Buffer.byteLength(body), "cache-control": "no-store" });
  res.end(body);
}

async function readJsonBody(req, limit = MAX_JSON_BODY_BYTES) {
  let size = 0; const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw Object.assign(new Error("Request body rejected"), { statusCode: 413 });
    chunks.push(chunk);
  }
  if (chunks.length === 0) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { throw Object.assign(new Error("Request body rejected"), { statusCode: 400 }); }
}

function createServerlessResponseAdapter(res) {
  let statusCode = 200; const headers = new Map();
  return {
    status(code) { statusCode = Number.isInteger(code) ? code : 500; return this; },
    setHeader(name, value) { headers.set(String(name).toLowerCase(), value); return this; },
    json(payload) { for (const [name, value] of headers) res.setHeader(name, value); sendJson(res, statusCode, payload); return this; },
  };
}

export async function createLocalDevServer(options = {}) {
  const host = options.host || DEFAULT_HOST; const port = options.port ?? DEFAULT_PORT;
  const handler = options.aiHandler || aiHandler;
  const vite = options.vite || await createViteServer({ server: { middlewareMode: true, hmr: false }, appType: "spa" });
  const server = createHttpServer(async (req, res) => {
    let pathname;
    try { pathname = new URL(req.url || "/", `http://${host}:${port}`).pathname; }
    catch { sendJson(res, 400, { ok: false, status: "blocked", reasonCode: "REQUEST_INTEGRITY_REQUIRED" }); return; }
    if (pathname !== "/api/ai") { vite.middlewares(req, res, () => sendJson(res, 404, { ok: false, status: "blocked", reasonCode: "NOT_FOUND" })); return; }
    if (req.method !== "POST") { sendJson(res, 405, { ok: false, status: "blocked", reasonCode: "REQUEST_INTEGRITY_REQUIRED" }); return; }
    try {
      const body = await readJsonBody(req, options.maxJsonBodyBytes || MAX_JSON_BODY_BYTES);
      await handler({ method: req.method, headers: req.headers, body }, createServerlessResponseAdapter(res));
    } catch (error) {
      sendJson(res, error?.statusCode === 413 ? 413 : 400, { ok: false, status: "blocked", reasonCode: "REQUEST_INTEGRITY_REQUIRED" });
    }
  });
  server.requestTimeout = 35_000;
  return { server, vite, host, port, async listen() { await new Promise((resolve, reject) => { server.once("error", reject); server.listen(port, host, resolve); }); const address = server.address(); return `http://${host}:${typeof address === "object" && address ? address.port : port}`; }, async close() { await new Promise((resolve) => server.close(resolve)); await vite.close(); } };
}

async function main() {
  const runtime = await createLocalDevServer(); const url = await runtime.listen();
  console.log(`KEVIRIO local full runtime: ${url}`);
  const shutdown = async () => { await runtime.close(); process.exit(0); };
  process.once("SIGINT", shutdown); process.once("SIGTERM", shutdown);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(() => { console.error("KEVIRIO local full runtime failed to start."); process.exit(1); });
