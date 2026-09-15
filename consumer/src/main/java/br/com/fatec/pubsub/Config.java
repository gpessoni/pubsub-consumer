package br.com.fatec.pubsub;

/**
 * Configuracao lida de variaveis de ambiente (com valores padrao para a demo).
 *
 * <ul>
 *   <li>{@code PUBSUB_PROJECT_ID}      (padrao {@code serjava-demo})</li>
 *   <li>{@code PUBSUB_SUBSCRIPTION_ID} (padrao {@code grupo-a})</li>
 *   <li>{@code DB_URL}                 (padrao {@code jdbc:postgresql://localhost:5432/marketplace})</li>
 *   <li>{@code DB_USER}                (padrao {@code marketplace_app})</li>
 *   <li>{@code DB_PASSWORD}            (padrao {@code mkt_2025_app})</li>
 * </ul>
 */
public record Config(
    String projectId,
    String subscriptionId,
    String dbUrl,
    String dbUser,
    String dbPassword) {

  public static Config fromEnv() {
    return new Config(
        env("PUBSUB_PROJECT_ID", "serjava-demo"),
        env("PUBSUB_SUBSCRIPTION_ID", "grupo-a"),
        env("DB_URL", "jdbc:postgresql://localhost:5432/marketplace"),
        env("DB_USER", "marketplace_app"),
        env("DB_PASSWORD", "mkt_2025_app"));
  }

  private static String env(String key, String def) {
    String v = System.getenv(key);
    return (v == null || v.isBlank()) ? def : v;
  }
}
