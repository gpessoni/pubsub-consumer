package br.com.fatec.pubsub.model;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Converte o JSON do Pedido (payload da mensagem Pub/Sub) para o modelo em
 * memoria. Os campos {@code total} do payload sao IGNORADOS: os totais sao
 * sempre recalculados aqui a partir de {@code unit_price * quantity}.
 */
public final class PedidoMapper {

  private static final ObjectMapper JSON = new ObjectMapper();

  private PedidoMapper() {}

  public static Pedido fromJson(String payload) throws Exception {
    JsonNode root = JSON.readTree(payload);

    Pedido.Cliente cliente = mapCliente(root.path("customer"));
    Pedido.Vendedor vendedor = mapVendedor(root.path("seller"));

    List<Pedido.Item> itens = new ArrayList<>();
    BigDecimal totalPedido = BigDecimal.ZERO;
    for (JsonNode itemNode : arrayOrEmpty(root.path("items"))) {
      Pedido.Item item = mapItem(itemNode);
      itens.add(item);
      totalPedido = totalPedido.add(item.total());
    }
    totalPedido = totalPedido.setScale(2, RoundingMode.HALF_UP);

    return new Pedido(
        text(root, "uuid"),
        parseInstant(text(root, "created_at")),
        text(root, "channel"),
        text(root, "status"),
        totalPedido,
        cliente,
        vendedor,
        itens,
        mapPagamento(root.path("payment")),
        mapEnvio(root.path("shipment")),
        mapMetadata(root.path("metadata")));
  }

  private static Pedido.Cliente mapCliente(JsonNode n) {
    if (n.isMissingNode() || n.isNull()) {
      throw new IllegalArgumentException("pedido sem 'customer'");
    }
    return new Pedido.Cliente(
        n.path("id").asLong(),
        text(n, "name"),
        text(n, "email"),
        text(n, "document"));
  }

  private static Pedido.Vendedor mapVendedor(JsonNode n) {
    if (n.isMissingNode() || n.isNull()) {
      return null;
    }
    return new Pedido.Vendedor(
        n.path("id").asLong(),
        text(n, "name"),
        text(n, "city"),
        text(n, "state"));
  }

  private static Pedido.Item mapItem(JsonNode n) {
    JsonNode prod = n.path("product");
    Pedido.Produto produto = new Pedido.Produto(text(prod, "id"), text(prod, "title"));

    Pedido.Categoria categoria = mapCategoria(n.path("category"));

    BigDecimal precoUnitario = decimal(n.path("unit_price"));
    int quantidade = n.path("quantity").asInt(0);
    BigDecimal totalItem =
        precoUnitario.multiply(BigDecimal.valueOf(quantidade)).setScale(2, RoundingMode.HALF_UP);

    return new Pedido.Item(
        n.path("id").asInt(),
        produto,
        categoria,
        precoUnitario,
        quantidade,
        totalItem);
  }

  /** category -> sub_category vira uma cadeia Categoria(pai) -> Categoria(filha). */
  private static Pedido.Categoria mapCategoria(JsonNode n) {
    if (n.isMissingNode() || n.isNull()) {
      return null;
    }
    Pedido.Categoria pai =
        new Pedido.Categoria(text(n, "id"), text(n, "name"), null);

    JsonNode sub = n.path("sub_category");
    if (sub.isMissingNode() || sub.isNull()) {
      return pai;
    }
    return new Pedido.Categoria(text(sub, "id"), text(sub, "name"), pai);
  }

  private static Pedido.Pagamento mapPagamento(JsonNode n) {
    if (n.isMissingNode() || n.isNull()) {
      return null;
    }
    return new Pedido.Pagamento(
        text(n, "method"), text(n, "status"), text(n, "transaction_id"));
  }

  private static Pedido.Envio mapEnvio(JsonNode n) {
    if (n.isMissingNode() || n.isNull()) {
      return null;
    }
    return new Pedido.Envio(
        text(n, "carrier"), text(n, "service"), text(n, "status"), text(n, "tracking_code"));
  }

  private static Pedido.Metadata mapMetadata(JsonNode n) {
    if (n.isMissingNode() || n.isNull()) {
      return null;
    }
    return new Pedido.Metadata(
        text(n, "source"), text(n, "user_agent"), text(n, "ip_address"));
  }

  // ----------------------------------------------------------------- helpers

  private static Iterable<JsonNode> arrayOrEmpty(JsonNode n) {
    return (n != null && n.isArray()) ? n : List.of();
  }

  private static String text(JsonNode n, String field) {
    JsonNode v = n.path(field);
    return (v.isMissingNode() || v.isNull()) ? null : v.asText();
  }

  private static BigDecimal decimal(JsonNode n) {
    if (n == null || n.isMissingNode() || n.isNull()) {
      return BigDecimal.ZERO;
    }
    return new BigDecimal(n.asText("0"));
  }

  private static OffsetDateTime parseInstant(String iso) {
    if (iso == null || iso.isBlank()) {
      return OffsetDateTime.now();
    }
    return OffsetDateTime.parse(iso);
  }
}
