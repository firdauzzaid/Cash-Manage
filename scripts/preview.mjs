import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../apps/mobile/dist", import.meta.url));
const types = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".json": "application/json",
  ".ttf": "font/ttf",
  ".png": "image/png",
};
const server = createServer(async (req, res) => {
  const path = resolve(
    root,
    "." + decodeURIComponent(new URL(req.url, "http://localhost").pathname),
  );
  if (path !== root && !path.startsWith(root + sep)) {
    res.writeHead(403);
    res.end();
    return;
  }
  try {
    let data;
    let ext = extname(path);
    try {
      data = await readFile(path);
    } catch {
      if (ext) {
        res.writeHead(404);
        res.end();
        return;
      }
      data = await readFile(resolve(root, "index.html"));
      ext = ".html";
    }
    res.writeHead(200, {
      "content-type": types[ext] ?? "application/octet-stream",
      "cache-control": "no-store",
    });
    res.end(data);
  } catch {
    res.writeHead(503);
    res.end("Run npm run export -w @cashflow/mobile first.");
  }
});
server.listen(8081, "127.0.0.1", () =>
  console.log(
    "Cash Flow web preview: http://localhost:8081 (native tests still required)",
  ),
);
