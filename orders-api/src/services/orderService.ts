import { OrderRepository } from "../repositories/orderRepository";
import { OrderHeaderRow } from "../repositories/orderRepository";
import { assembleOrder, buildOrderItem } from "../mappers/orderMapper";
import { Order, OrderItem } from "../types/order";
import { OrdersFilter } from "../validation/ordersFilter";
import { Pagination } from "../validation/pagination";
import { Sort } from "../validation/sorting";
import { groupBy, indexBy } from "../utils/collections";

export class OrderService {
  constructor(private readonly repo: OrderRepository) {}

  async list(
    filter: OrdersFilter,
    pagination: Pagination,
    sort: Sort
  ): Promise<{ orders: Order[]; totalCount: number }> {
    const { headers, totalCount } = await this.repo.findMany(filter, pagination, sort);
    const orders = await this.hydrate(headers);
    return { orders, totalCount };
  }

  async getByUuid(uuid: string): Promise<Order | null> {
    const header = await this.repo.findByUuid(uuid);
    if (!header) return null;
    const [order] = await this.hydrate([header]);
    return order ?? null;
  }

  /** Retorna apenas os `items` de um pedido, ja com o total calculado. */
  async getItems(uuid: string): Promise<OrderItem[] | null> {
    const header = await this.repo.findByUuid(uuid);
    if (!header) return null;
    const itemRows = await this.repo.findItemsByOrderIds([header.id]);
    return itemRows.map(buildOrderItem);
  }

  private async hydrate(headers: OrderHeaderRow[]): Promise<Order[]> {
    if (headers.length === 0) return [];
    const ids = headers.map((h) => h.id);

    const [items, payments, shipments, metadata] = await Promise.all([
      this.repo.findItemsByOrderIds(ids),
      this.repo.findPaymentsByOrderIds(ids),
      this.repo.findShipmentsByOrderIds(ids),
      this.repo.findMetadataByOrderIds(ids),
    ]);

    const itemsByOrder = groupBy(items, (r) => r.id_pedido);
    const paymentByOrder = indexBy(payments, (r) => r.id_pedido);
    const shipmentByOrder = indexBy(shipments, (r) => r.id_pedido);
    const metadataByOrder = indexBy(metadata, (r) => r.id_pedido);

    return headers.map((header) =>
      assembleOrder(
        header,
        itemsByOrder.get(header.id) ?? [],
        paymentByOrder.get(header.id) ?? null,
        shipmentByOrder.get(header.id) ?? null,
        metadataByOrder.get(header.id) ?? null
      )
    );
  }
}
