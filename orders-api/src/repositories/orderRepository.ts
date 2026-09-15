import { OrdersFilter } from "../validation/ordersFilter";
import { FinancialSummaryFilter } from "../validation/financialSummaryFilter";
import { Pagination } from "../validation/pagination";
import { Sort } from "../validation/sorting";

/** Linha "cabecalho" do pedido (sem items/pagamento/envio/metadata). */
export interface OrderHeaderRow {
  id: number;
  uuid: string;
  created_at: Date;
  channel: string | null;
  status: string;
  customer_id: number;
  customer_name: string;
  customer_email: string | null;
  customer_document: string | null;
  seller_id: number | null;
  seller_name: string | null;
  seller_city: string | null;
  seller_state: string | null;
}

export interface OrderItemRow {
  id_pedido: number;
  seq: number;
  preco_unitario: string; // NUMERIC vem como string do driver `pg`
  quantidade: number;
  product_id: string;
  product_title: string;
  sub_cat_id: string | null;
  sub_cat_name: string | null;
  parent_cat_id: string | null;
  parent_cat_name: string | null;
}

export interface PaymentRow {
  id_pedido: number;
  metodo: string | null;
  status: string | null;
  transaction_id: string | null;
}

export interface ShipmentRow {
  id_pedido: number;
  carrier: string | null;
  servico: string | null;
  status: string | null;
  tracking_code: string | null;
}

export interface MetadataRow {
  id_pedido: number;
  source: string | null;
  user_agent: string | null;
  ip_address: string | null;
}

/** Uma linha por pedido, ja com o total calculado a partir dos items. */
export interface FinancialRow {
  id: number;
  status: string;
  payment_method: string | null;
  total: string; // NUMERIC como string
}

export interface OrderRepository {
  findMany(
    filter: OrdersFilter,
    pagination: Pagination,
    sort: Sort
  ): Promise<{ headers: OrderHeaderRow[]; totalCount: number }>;

  findByUuid(uuid: string): Promise<OrderHeaderRow | null>;

  findItemsByOrderIds(orderIds: number[]): Promise<OrderItemRow[]>;
  findPaymentsByOrderIds(orderIds: number[]): Promise<PaymentRow[]>;
  findShipmentsByOrderIds(orderIds: number[]): Promise<ShipmentRow[]>;
  findMetadataByOrderIds(orderIds: number[]): Promise<MetadataRow[]>;

  /** Uma linha por pedido que casa com os filtros, pronta para agregacao em memoria. */
  findFinancialRows(filter: FinancialSummaryFilter): Promise<FinancialRow[]>;
}
