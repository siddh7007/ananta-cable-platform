import { build } from './app.js';

async function startServer() {
  const server = await build();

  const port = Number(process.env.PORT ?? 4001);
  server.listen({ host: "localhost", port });
}

startServer();
