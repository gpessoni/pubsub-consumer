package br.com.fatec.pubsub.model;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

/**
 * Representacao em memoria de um Pedido do marketplace, ja com os totais
 * calculados. Os sub-registros espelham as entidades do banco relacional.
 */
public record Pedido(
    String uuid,
    OffsetDateTime createdAt,
    String channel,
    String status,
    BigDecimal total,            // CALCULADO: soma dos totais de item
    Cliente cliente,
    Vendedor vendedor,
    List<Item> itens,
    Pagamento pagamento,
    Envio envio,
    Metadata metadata) {

  public record Cliente(long id, String nome, String email, String documento) {}

  public record Vendedor(long id, String nome, String cidade, String estado) {}

  /** Categoria auto-relacionada: {@code pai} pode ser nulo (categoria raiz). */
  public record Categoria(String id, String nome, Categoria pai) {}

  public record Produto(String id, String titulo) {}

  public record Item(
      int seq,
      Produto produto,
      Categoria categoria,       // sub_categoria (nivel mais especifico do JSON)
      BigDecimal precoUnitario,
      int quantidade,
      BigDecimal total) {}       // CALCULADO: precoUnitario * quantidade

  public record Pagamento(String metodo, String status, String transactionId) {}

  public record Envio(String carrier, String servico, String status, String trackingCode) {}

  public record Metadata(String source, String userAgent, String ipAddress) {}
}
