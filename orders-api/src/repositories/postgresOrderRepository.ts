import { Pool } from "pg";
import { OrdersFilter } from "../validation/ordersFilter";
import { FinancialSummaryFilter } from "../validation/financialSummaryFilter";
import { Pagination } from "../validation/pagination";
import { Sort } from "../validation/sorting";
import {
  FinancialRow,
  MetadataRow,
  OrderHeaderRow,
  OrderItemRow,
  OrderRepository,
  PaymentRow,
  ShipmentRow,
} from "./orderRepository";

const HEADER_COLUMNS = `
  p.id, p.uuid, p.created_at, p.channel, p.status,
  c.id AS customer_id, c.nome AS customer_name, c.email AS customer_email, c.documento AS customer_document,
  v.id AS seller_id, v.nome AS seller_name, v.cidade AS seller_city, v.estado AS seller_state
`;

const HEADER_FROM = `
  FROM pedido p
  JOIN cliente c ON c.id = p.id_cliente
  LEFT JOIN vendedor v ON v.id = p.id_vendedor
`;

export class PostgresOrderRepository implements OrderRepository {
  constructor(private readonly pool: Pool) {}

  async findMany(
    filter: OrdersFilter,
    pagination: Pagination,
    sort: Sort
  ): Promise<{ headers: OrderHeaderRow[]; totalCount: number }> {
    const { where, params } = buildOrdersWhere(filter);

    params.push(pagination.pageSize);
    const limitIdx = params.length;
    params.push(pagination.offset);
    const offsetIdx = params.length;

    const sql = `
      SELECT ${HEADER_COLUMNS}, COUNT(*) OVER() AS total_count
      ${HEADER_FROM}
      ${where}
      ORDER BY p.created_at ${sort.direction}, p.id ${sort.direction}
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;

    const result = await this.pool.query(sql, params);
    const totalCount = result.rows.length > 0 ? Number(result.rows[0].total_count) : 0;
    const headers: OrderHeaderRow[] = result.rows.map(({ total_count, ...row }) => row);
    return { headers, totalCount };
  }

  async findByUuid(uuid: string): Promise<OrderHeaderRow | null> {
    const sql = `
      SELECT ${HEADER_COLUMNS}
      ${HEADER_FROM}
      WHERE p.uuid = $1
    `;
    const result = await this.pool.query<OrderHeaderRow>(sql, [uuid]);
    return result.rows[0] ?? null;
  }

  async findItemsByOrderIds(orderIds: number[]): Promise<OrderItemRow[]> {
    if (orderIds.length === 0) return [];
    const sql = `
      SELECT
        ip.id_pedido, ip.seq, ip.preco_unitario, ip.quantidade,
        pr.id AS product_id, pr.titulo AS product_title,
        sub.id AS sub_cat_id, sub.nome AS sub_cat_name,
        parent.id AS parent_cat_id, parent.nome AS parent_cat_name
      FROM item_pedido ip
      JOIN produto pr ON pr.id = ip.id_produto
      LEFT JOIN categoria sub ON sub.id = ip.id_categoria
      LEFT JOIN categoria parent ON parent.id = sub.id_categoria_pai
      WHERE ip.id_pedido = ANY($1::bigint[])
      ORDER BY ip.id_pedido, ip.seq
    `;
    const result = await this.pool.query<OrderItemRow>(sql, [orderIds]);
    return result.rows;
  }

  async findPaymentsByOrderIds(orderIds: number[]): Promise<PaymentRow[]> {
    if (orderIds.length === 0) return [];
    const sql = `
      SELECT id_pedido, metodo, status, transaction_id
      FROM pagamento
      WHERE id_pedido = ANY($1::bigint[])
    `;
    const result = await this.pool.query<PaymentRow>(sql, [orderIds]);
    return result.rows;
  }

  async findShipmentsByOrderIds(orderIds: number[]): Promise<ShipmentRow[]> {
    if (orderIds.length === 0) return [];
    const sql = `
      SELECT id_pedido, carrier, servico, status, tracking_code
      FROM envio
      WHERE id_pedido = ANY($1::bigint[])
    `;
    const result = await this.pool.query<ShipmentRow>(sql, [orderIds]);
    return result.rows;
  }

  async findMetadataByOrderIds(orderIds: number[]): Promise<MetadataRow[]> {
    if (orderIds.length === 0) return [];
    const sql = `
      SELECT id_pedido, source, user_agent, ip_address
      FROM metadata_pedido
      WHERE id_pedido = ANY($1::bigint[])
    `;
    const result = await this.pool.query<MetadataRow>(sql, [orderIds]);
    return result.rows;
  }

  async findFinancialRows(filter: FinancialSummaryFilter): Promise<FinancialRow[]> {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filter.sellerId !== undefined) {
      params.push(filter.sellerId);
      conditions.push(`p.id_vendedor = $${params.length}`);
    }
    if (filter.startDate !== undefined) {
      params.push(filter.startDate);
      conditions.push(`p.created_at >= $${params.length}`);
    }
    if (filter.endDate !== undefined) {
      params.push(filter.endDate);
      conditions.push(`p.created_at <= $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    // Uma linha por pedido, com o total calculado dinamicamente a partir dos
    // items (nunca a partir da coluna `pedido.total` armazenada).
    const sql = `
      WITH filtered_orders AS (
        SELECT p.id, p.status, pay.metodo AS payment_method
        FROM pedido p
        LEFT JOIN pagamento pay ON pay.id_pedido = p.id
        ${where}
      )
      SELECT
        fo.id, fo.status, fo.payment_method,
        COALESCE(SUM(ip.preco_unitario * ip.quantidade), 0) AS total
      FROM filtered_orders fo
      LEFT JOIN item_pedido ip ON ip.id_pedido = fo.id
      GROUP BY fo.id, fo.status, fo.payment_method
    `;

    const result = await this.pool.query<FinancialRow>(sql, params);
    return result.rows;
  }
}

function buildOrdersWhere(filter: OrdersFilter): { where: string; params: unknown[] } {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filter.customerId !== undefined) {
    params.push(filter.customerId);
    conditions.push(`p.id_cliente = $${params.length}`);
  }
  if (filter.sellerId !== undefined) {
    params.push(filter.sellerId);
    conditions.push(`p.id_vendedor = $${params.length}`);
  }
  if (filter.status !== undefined) {
    params.push(filter.status);
    conditions.push(`p.status = $${params.length}`);
  }
  if (filter.productId !== undefined) {
    params.push(filter.productId);
    conditions.push(
      `EXISTS (SELECT 1 FROM item_pedido ip WHERE ip.id_pedido = p.id AND ip.id_produto = $${params.length})`
    );
  }

  return {
    where: conditions.length ? `WHERE ${conditions.join(" AND ")}` : "",
    params,
  };
}
