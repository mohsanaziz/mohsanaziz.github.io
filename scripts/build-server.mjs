import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';

const CONTENT_TYPES = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.jpg', 'image/jpeg'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.webp', 'image/webp'],
  ['.woff2', 'font/woff2'],
]);

function resolveRequestPath(buildDirectory, requestUrl) {
  const pathname = decodeURIComponent(new URL(requestUrl ?? '/', 'http://localhost').pathname);
  const relativePath = pathname.replace(/^\/+/, '');
  const documentPath = extname(relativePath) ? relativePath : relativePath ? `${relativePath.replace(/\/$/, '')}/index.html` : 'index.html';
  const absolutePath = resolve(buildDirectory, documentPath);

  if (absolutePath !== buildDirectory && !absolutePath.startsWith(`${buildDirectory}${sep}`)) {
    throw new Error(`Path outside the build directory: ${pathname}`);
  }

  return absolutePath;
}

export function startBuildServer(buildDirectory) {
  const server = createServer(async (request, response) => {
    try {
      const filePath = resolveRequestPath(buildDirectory, request.url);
      const fileStats = await stat(filePath);

      if (!fileStats.isFile()) {
        throw new Error(`Not a file: ${filePath}`);
      }

      const contents = await readFile(filePath);

      response.writeHead(200, {
        'content-length': fileStats.size,
        'content-type': CONTENT_TYPES.get(extname(filePath)) ?? 'application/octet-stream',
      });

      if (request.method === 'HEAD') {
        response.end();
        return;
      }

      response.end(contents);
    } catch {
      response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('Not found');
    }
  });

  return new Promise((resolveServer, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();

      if (!address || typeof address === 'string') {
        server.close();
        reject(new Error('Unable to determine the build server address.'));
        return;
      }

      resolveServer({
        origin: `http://127.0.0.1:${address.port}`,
        close: () => new Promise((resolveClose, rejectClose) => server.close((error) => (error ? rejectClose(error) : resolveClose()))),
      });
    });
  });
}
