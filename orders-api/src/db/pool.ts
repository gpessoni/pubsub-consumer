import { Pool } from "pg";
import { config } from "../config";

/**
 * Pool de conexoes compartilhado com o banco `marketplace`, o mesmo banco
 * alimentado pelo pubsub-consumer (Java). Esta API e somente leitura.
 */
export const pool = new Pool({
  connectionString: config.db.connectionString,
  user: config.db.user,
  password: config.db.password,
  max: config.db.poolMax,
});

pool.on("error", (err) => {
  // Erro em um client ocioso do pool (ex.: conexao derrubada pelo servidor).
  // Nao derruba o processo; a proxima query tenta obter um novo client.
  // eslint-disable-next-line no-console
  console.error("Erro inesperado no pool de conexoes do Postgres:", err);
});
