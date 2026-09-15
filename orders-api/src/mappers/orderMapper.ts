import {
  MetadataRow,
  OrderHeaderRow,
  OrderItemRow,
  PaymentRow,
  ShipmentRow,
} from "../repositories/orderRepository";
import { Category, Order, OrderItem } from "../types/order";

/** Arredonda para 2 casas decimais evitando ruido de ponto flutuante. */
function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function toNumber(value: string | number): number {
  return typeof value === "number" ? value : Number.parseFloat(value);
}

/**
 * Reconstroi a hierarquia de categoria a partir da categoria mais especifica
 * (armazenada no item) e sua categoria pai (auto-relacionamento em `categoria`).
 * Sem pai cadastrado, a propria categoria armazenada vira o nivel de topo.
 */
export function buildCategory(row: OrderItemRow): Category | null {
  if (!row.sub_cat_id) return null;

  if (!row.parent_cat_id) {
    return { id: row.sub_cat_id, name: row.sub_cat_name ?? "" };
  }

  return {
    id: row.parent_cat_id,
    name: row.parent_cat_name ?? "",
    sub_category: { id: row.sub_cat_id, name: row.sub_cat_name ?? "" },
  };
}

/** Monta um item do pedido, calculando `total = unit_price * quantity`. */
export function buildOrderItem(row: OrderItemRow): OrderItem {
  const unitPrice = toNumber(row.preco_unitario);
  const quantity = row.quantidade;

  return {
    id: row.seq,
    product: { id: row.product_id, title: row.product_title },
    unit_price: round2(unitPrice),
    quantity,
    category: buildCategory(row),
    total: round2(unitPrice * quantity),
  };
}

/** Soma os totais dos items para obter o total do pedido (sempre calculado). */
export function calculateOrderTotal(items: OrderItem[]): number {
  return round2(items.reduce((sum, item) => sum + item.total, 0));
}

export function assembleOrder(
  header: OrderHeaderRow,
  itemRows: OrderItemRow[],
  payment: PaymentRow | null,
  shipment: ShipmentRow | null,
  metadata: MetadataRow | null
): Order {
  const items = itemRows.map(buildOrderItem);

  return {
    uuid: header.uuid,
    created_at: header.created_at.toISOString(),
    channel: header.channel,
    total: calculateOrderTotal(items),
    status: header.status,
    customer: {
      id: header.customer_id,
      name: header.customer_name,
      email: header.customer_email,
      document: header.customer_document,
    },
    seller: header.seller_id
      ? {
          id: header.seller_id,
          name: header.seller_name ?? "",
          city: header.seller_city,
          state: header.seller_state,
        }
      : null,
    items,
    shipment: shipment
      ? {
          carrier: shipment.carrier,
          service: shipment.servico,
          status: shipment.status,
          tracking_code: shipment.tracking_code,
        }
      : null,
    payment: payment
      ? { method: payment.metodo, status: payment.status, transaction_id: payment.transaction_id }
      : null,
    metadata: metadata
      ? { source: metadata.source, user_agent: metadata.user_agent, ip_address: metadata.ip_address }
      : null,
  };
}
