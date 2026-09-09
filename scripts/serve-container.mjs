#!/usr/bin/env node
// Container entrypoint: the same vite dev-server runtime the Pinokio launcher
// uses (the /api/* proxies only exist as dev-server middleware), minus the file
// watcher and HMR.
//
// A deployed instance never edits its own source, and chokidar's recursive watch
// exhausts the Docker host's fs.inotify.max_user_instances (EMFILE) on a box
// already running dozens of containers. watch:null skips the watcher entirely;
// hmr:false stops the browser client from retrying a websocket nobody serves.
import { createServer } from 'vite';

const host = process.env.HOST || '0.0.0.0';
const port = Number.parseInt(process.env.PORT || '4173', 10);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error(`invalid PORT: ${process.env.PORT}`);
}

const server = await createServer({
  server: { host, port, strictPort: true, watch: null, hmr: false },
});
await server.listen();
server.printUrls();

// npm/sh would swallow these; owning the process means docker stop is clean
// instead of a 10s SIGKILL wait on every redeploy.
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, async () => {
    await server.close();
    process.exit(0);
  });
}
