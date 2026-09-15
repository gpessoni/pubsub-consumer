package br.com.fatec.pubsub.persistence;

import br.com.fatec.pubsub.model.Pedido;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;

/**
 * Persiste um {@link Pedido} completo numa unica transacao.
 *
 * <p>A operacao e idempotente: reentrega da mesma mensagem pelo Pub/Sub faz
 * UPSERT do pedido (por {@code uuid}) e regrava os filhos, atualizando a coluna
 * {@code indexed_at} para a hora da reindexacao.
 */
public final class PedidoRepository {

  private final Db db;

  public PedidoRepository(Db db) {
    this.db = db;
  }

  /** SQLStates de deadlock (40P01) e falha de serializacao (40001) do PostgreSQL. */
  private static final int MAX_TENTATIVAS = 4;

  /**
   * @return id gerado (ou existente) do pedido na tabela {@code pedido}.
   *
   * <p>O consumidor Pub/Sub processa mensagens em paralelo; upserts concorrentes
   * nas tabelas de dimensao podem gerar deadlock. Nesse caso a transacao e
   * reexecutada ({@value #MAX_TENTATIVAS} tentativas com backoff curto).
   */
  public long salvar(Pedido p, String messageId, String subscription, String rawJson)
      throws SQLException {
    for (int tentativa = 1; ; tentativa++) {
      try {
        return salvarUmaVez(p, messageId, subscription, rawJson);
      } catch (SQLException e) {
        String state = e.getSQLState();
        boolean retryavel = "40P01".equals(state) || "40001".equals(state);
        if (!retryavel || tentativa >= MAX_TENTATIVAS) {
          throw e;
        }
        try {
          Thread.sleep(50L * tentativa);
        } catch (InterruptedException ie) {
          Thread.currentThread().interrupt();
          throw e;
        }
      }
    }
  }

  private long salvarUmaVez(Pedido p, String messageId, String subscription, String rawJson)
      throws SQLException {
    try (Connection cn = db.open()) {
      cn.setAutoCommit(false);
      try {
        upsertCliente(cn, p.cliente());
        if (p.vendedor() != null) {
          upsertVendedor(cn, p.vendedor());
        }
        for (Pedido.Item item : p.itens()) {
          upsertCategoria(cn, item.categoria());
          upsertProduto(cn, item.produto());
        }

        long pedidoId = upsertPedido(cn, p, messageId, subscription, rawJson);

        // regrava filhos (idempotencia em reentrega)
        deleteFilhos(cn, pedidoId);
        for (Pedido.Item item : p.itens()) {
          insertItem(cn, pedidoId, item);
        }
        if (p.pagamento() != null) {
          insertPagamento(cn, pedidoId, p.pagamento());
        }
        if (p.envio() != null) {
          insertEnvio(cn, pedidoId, p.envio());
        }
        if (p.metadata() != null) {
          insertMetadata(cn, pedidoId, p.metadata());
        }

        cn.commit();
        return pedidoId;
      } catch (SQLException e) {
        cn.rollback();
        throw e;
      }
    }
  }

  // ------------------------------------------------------------ dimensoes

  private void upsertCliente(Connection cn, Pedido.Cliente c) throws SQLException {
    String sql =
        "INSERT INTO cliente (id, nome, email, documento) VALUES (?, ?, ?, ?) "
            + "ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome, "
            + "email = EXCLUDED.email, documento = EXCLUDED.documento";
    try (PreparedStatement ps = cn.prepareStatement(sql)) {
      ps.setLong(1, c.id());
      ps.setString(2, c.nome());
      ps.setString(3, c.email());
      ps.setString(4, c.documento());
      ps.executeUpdate();
    }
  }

  private void upsertVendedor(Connection cn, Pedido.Vendedor v) throws SQLException {
    String sql =
        "INSERT INTO vendedor (id, nome, cidade, estado) VALUES (?, ?, ?, ?) "
            + "ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome, "
            + "cidade = EXCLUDED.cidade, estado = EXCLUDED.estado";
    try (PreparedStatement ps = cn.prepareStatement(sql)) {
      ps.setLong(1, v.id());
      ps.setString(2, v.nome());
      ps.setString(3, v.cidade());
      ps.setString(4, v.estado());
      ps.executeUpdate();
    }
  }

  /** Grava a cadeia de categorias (pai antes da filha) para respeitar a FK. */
  private void upsertCategoria(Connection cn, Pedido.Categoria cat) throws SQLException {
    if (cat == null) {
      return;
    }
    if (cat.pai() != null) {
      upsertCategoria(cn, cat.pai());
    }
    String sql =
        "INSERT INTO categoria (id, nome, id_categoria_pai) VALUES (?, ?, ?) "
            + "ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome, "
            + "id_categoria_pai = EXCLUDED.id_categoria_pai";
    try (PreparedStatement ps = cn.prepareStatement(sql)) {
      ps.setString(1, cat.id());
      ps.setString(2, cat.nome());
      if (cat.pai() != null) {
        ps.setString(3, cat.pai().id());
      } else {
        ps.setNull(3, Types.VARCHAR);
      }
      ps.executeUpdate();
    }
  }

  private void upsertProduto(Connection cn, Pedido.Produto prod) throws SQLException {
    String sql =
        "INSERT INTO produto (id, titulo) VALUES (?, ?) "
            + "ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo";
    try (PreparedStatement ps = cn.prepareStatement(sql)) {
      ps.setString(1, prod.id());
      ps.setString(2, prod.titulo());
      ps.executeUpdate();
    }
  }

  // ------------------------------------------------------------ pedido

  private long upsertPedido(
      Connection cn, Pedido p, String messageId, String subscription, String rawJson)
      throws SQLException {
    String sql =
        "INSERT INTO pedido (uuid, created_at, channel, status, total, id_cliente, "
            + "id_vendedor, pubsub_message_id, pubsub_subscription, payload_json, indexed_at) "
            + "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?::jsonb, now()) "
            + "ON CONFLICT (uuid) DO UPDATE SET created_at = EXCLUDED.created_at, "
            + "channel = EXCLUDED.channel, status = EXCLUDED.status, total = EXCLUDED.total, "
            + "id_cliente = EXCLUDED.id_cliente, id_vendedor = EXCLUDED.id_vendedor, "
            + "pubsub_message_id = EXCLUDED.pubsub_message_id, "
            + "pubsub_subscription = EXCLUDED.pubsub_subscription, "
            + "payload_json = EXCLUDED.payload_json, indexed_at = now() "
            + "RETURNING id";
    try (PreparedStatement ps = cn.prepareStatement(sql)) {
      ps.setString(1, p.uuid());
      ps.setObject(2, p.createdAt());
      ps.setString(3, p.channel());
      ps.setString(4, p.status());
      ps.setBigDecimal(5, p.total());
      ps.setLong(6, p.cliente().id());
      if (p.vendedor() != null) {
        ps.setLong(7, p.vendedor().id());
      } else {
        ps.setNull(7, Types.BIGINT);
      }
      ps.setString(8, messageId);
      ps.setString(9, subscription);
      ps.setString(10, rawJson);
      try (ResultSet rs = ps.executeQuery()) {
        rs.next();
        return rs.getLong(1);
      }
    }
  }

  private void deleteFilhos(Connection cn, long pedidoId) throws SQLException {
    for (String t : new String[] {"item_pedido", "pagamento", "envio", "metadata_pedido"}) {
      try (PreparedStatement ps = cn.prepareStatement("DELETE FROM " + t + " WHERE id_pedido = ?")) {
        ps.setLong(1, pedidoId);
        ps.executeUpdate();
      }
    }
  }

  private void insertItem(Connection cn, long pedidoId, Pedido.Item item) throws SQLException {
    String sql =
        "INSERT INTO item_pedido (id_pedido, seq, id_produto, id_categoria, "
            + "preco_unitario, quantidade, total, indexed_at) "
            + "VALUES (?, ?, ?, ?, ?, ?, ?, now())";
    try (PreparedStatement ps = cn.prepareStatement(sql)) {
      ps.setLong(1, pedidoId);
      ps.setInt(2, item.seq());
      ps.setString(3, item.produto().id());
      if (item.categoria() != null) {
        ps.setString(4, item.categoria().id());
      } else {
        ps.setNull(4, Types.VARCHAR);
      }
      ps.setBigDecimal(5, item.precoUnitario());
      ps.setInt(6, item.quantidade());
      ps.setBigDecimal(7, item.total());
      ps.executeUpdate();
    }
  }

  private void insertPagamento(Connection cn, long pedidoId, Pedido.Pagamento pg)
      throws SQLException {
    String sql =
        "INSERT INTO pagamento (id_pedido, metodo, status, transaction_id) VALUES (?, ?, ?, ?)";
    try (PreparedStatement ps = cn.prepareStatement(sql)) {
      ps.setLong(1, pedidoId);
      ps.setString(2, pg.metodo());
      ps.setString(3, pg.status());
      ps.setString(4, pg.transactionId());
      ps.executeUpdate();
    }
  }

  private void insertEnvio(Connection cn, long pedidoId, Pedido.Envio en) throws SQLException {
    String sql =
        "INSERT INTO envio (id_pedido, carrier, servico, status, tracking_code) "
            + "VALUES (?, ?, ?, ?, ?)";
    try (PreparedStatement ps = cn.prepareStatement(sql)) {
      ps.setLong(1, pedidoId);
      ps.setString(2, en.carrier());
      ps.setString(3, en.servico());
      ps.setString(4, en.status());
      ps.setString(5, en.trackingCode());
      ps.executeUpdate();
    }
  }

  private void insertMetadata(Connection cn, long pedidoId, Pedido.Metadata md)
      throws SQLException {
    String sql =
        "INSERT INTO metadata_pedido (id_pedido, source, user_agent, ip_address) "
            + "VALUES (?, ?, ?, ?)";
    try (PreparedStatement ps = cn.prepareStatement(sql)) {
      ps.setLong(1, pedidoId);
      ps.setString(2, md.source());
      ps.setString(3, md.userAgent());
      ps.setString(4, md.ipAddress());
      ps.executeUpdate();
    }
  }
}
