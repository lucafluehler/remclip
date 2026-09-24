import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, extname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../dist');
const port = Number(process.env.PORT ?? 8080);
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
};

const server = createServer(async (request, response) => {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Headers', 'baggage, sentry-trace, content-type');
  response.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  response.setHeader('Cache-Control', 'no-store');

  if (request.method === 'OPTIONS') {
    response.writeHead(204).end();
    return;
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405).end();
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  } catch {
    response.writeHead(400).end();
    return;
  }

  const filePath = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
  const pathFromRoot = relative(root, filePath);
  if (pathFromRoot === '..' || pathFromRoot.startsWith(`..${sep}`)) {
    response.writeHead(403).end();
    return;
  }

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      response.writeHead(404).end();
      return;
    }
    response.setHeader('Content-Type', mimeTypes[extname(filePath)] ?? 'application/octet-stream');
    response.setHeader('Content-Length', fileStat.size);
    response.writeHead(200);
    if (request.method === 'HEAD') {
      response.end();
    } else {
      createReadStream(filePath).pipe(response);
    }
  } catch {
    response.writeHead(404).end();
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Serving production plugin from ${root} at http://localhost:${port}`);
});
