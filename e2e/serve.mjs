// Static server with SPA fallback for the exported web build (e2e only).
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join } from 'node:path';
const root = process.argv[2] ?? 'dist-e2e';
const port = Number(process.argv[3] ?? 8099);
const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.ttf': 'font/ttf', '.json': 'application/json', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
createServer(async (req, res) => {
  const p = decodeURIComponent((req.url ?? '/').split('?')[0]);
  let f = join(root, p);
  try {
    if (!(await stat(f)).isFile()) throw 0;
  } catch {
    f = join(root, 'index.html');
  }
  res.writeHead(200, { 'Content-Type': types[extname(f)] ?? 'application/octet-stream' });
  res.end(await readFile(f));
}).listen(port, () => console.log(`serving ${root} on ${port}`));
