import { config } from "./config";
import { pool } from "./db/pool";
import { createApp } from "./app";

const app = createApp(pool);

const server = app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`orders-api ouvindo na porta ${config.port}`);
});

async function shutdown(signal: string): Promise<void> {
  // eslint-disable-next-line no-console
  console.log(`Recebido ${signal}, encerrando...`);
  server.close(() => {
    pool.end().finally(() => process.exit(0));
  });
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
