import { build } from './app.js';

async function startServer() {
  try {
    const server = await build();

    const port = Number(process.env.PORT ?? 4001);
    const host = process.env.HOST ?? "127.0.0.1";
    
    await server.listen({ 
      host,
      port,
      listenTextResolver: (address) => `Server listening at ${address}`
    });
    
    console.log(`✅ Server started successfully on http://${host}:${port}`);
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    console.error('Error details:', error);
    process.exit(1);
  }
}

startServer();
