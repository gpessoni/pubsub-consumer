import "dotenv/config";

function env(key: string, def: string): string {
  const value = process.env[key];
  return value === undefined || value.trim() === "" ? def : value;
}

function envInt(key: string, def: number): number {
  const raw = process.env[key];
  if (raw === undefined || raw.trim() === "") return def;
  const parsed = Number.parseInt(raw, 10);
  return Number.isNaN(parsed) ? def : parsed;
}

/** Remove o prefixo `jdbc:` usado no projeto Java, se presente. */
function normalizeDbUrl(url: string): string {
  return url.startsWith("jdbc:") ? url.slice("jdbc:".length) : url;
}

/**
 * Embute user/password na connection string quando ela ainda nao os tem.
 * Necessario porque o `pg` reconstroi a config a partir da connection string
 * e sobrescreve `user`/`password` explicitos com os (vazios) da URL caso
 * eles nao estejam presentes nela, quebrando a autenticacao SCRAM.
 */
function withCredentials(url: string, user: string, password: string): string {
  const match = url.match(/^(postgres(?:ql)?:\/\/)(.*)$/);
  if (!match) return url;
  const [, scheme, rest] = match;
  if (rest.includes("@")) return url;
  return `${scheme}${encodeURIComponent(user)}:${encodeURIComponent(password)}@${rest}`;
}

const dbUser = env("DB_USER", "marketplace_app");
const dbPassword = env("DB_PASSWORD", "mkt_2025_app");

export const config = {
  port: envInt("PORT", 3000),
  db: {
    connectionString: withCredentials(
      normalizeDbUrl(env("DB_URL", "postgresql://localhost:5432/marketplace")),
      dbUser,
      dbPassword
    ),
    user: dbUser,
    password: dbPassword,
    poolMax: envInt("DB_POOL_MAX", 10),
  },
  pagination: {
    defaultPageSize: envInt("DEFAULT_PAGE_SIZE", 20),
    maxPageSize: envInt("MAX_PAGE_SIZE", 100),
  },
} as const;
