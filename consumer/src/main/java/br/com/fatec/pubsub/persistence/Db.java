package br.com.fatec.pubsub.persistence;

import br.com.fatec.pubsub.Config;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;

/** Fabrica de conexoes JDBC e inicializacao do schema. */
public final class Db {

  private final String url;
  private final String user;
  private final String password;

  public Db(Config cfg) {
    this.url = cfg.dbUrl();
    this.user = cfg.dbUser();
    this.password = cfg.dbPassword();
  }

  public Connection open() throws SQLException {
    return DriverManager.getConnection(url, user, password);
  }

  /** Cria as tabelas (idempotente) a partir de {@code src/main/resources/schema.sql}. */
  public void initSchema() throws SQLException, IOException {
    String ddl = readResource("/schema.sql");
    try (Connection cn = open(); Statement st = cn.createStatement()) {
      st.execute(ddl);
    }
  }

  private static String readResource(String path) throws IOException {
    try (InputStream in = Db.class.getResourceAsStream(path)) {
      if (in == null) {
        throw new IOException("recurso nao encontrado no classpath: " + path);
      }
      return new String(in.readAllBytes(), StandardCharsets.UTF_8);
    }
  }
}
