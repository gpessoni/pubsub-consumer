import { OrderRepository } from "../repositories/orderRepository";
import { ORDER_STATUSES } from "../types/order";
import { FinancialSummary } from "../types/financialSummary";
import { FinancialSummaryFilter } from "../validation/financialSummaryFilter";

/** Metodos de pagamento conhecidos, sempre presentes na resposta (mesmo com contagem 0). */
const KNOWN_PAYMENT_METHODS = ["pix", "credit_card", "boleto"] as const;

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Uma linha por pedido ja filtrado, com o total dinamico calculado no repositorio. */
export interface FinancialRowInput {
  status: string;
  payment_method: string | null;
  total: string | number;
}

/**
 * Agrega linhas de pedido (uma por pedido) no formato de resposta do
 * `/orders/financial-summary`. Funcao pura, testavel sem banco de dados.
 */
export function aggregateFinancialSummary(rows: FinancialRowInput[]): FinancialSummary {
  const byStatus: Record<string, number> = {};
  for (const status of ORDER_STATUSES) byStatus[status] = 0;

  const byPaymentMethod: Record<string, { count: number; total: number }> = {};
  for (const method of KNOWN_PAYMENT_METHODS) byPaymentMethod[method] = { count: 0, total: 0 };

  let totalRevenue = 0;

  for (const row of rows) {
    const total = typeof row.total === "number" ? row.total : Number.parseFloat(row.total);
    totalRevenue += total;

    byStatus[row.status] = (byStatus[row.status] ?? 0) + 1;

    if (row.payment_method) {
      const bucket = byPaymentMethod[row.payment_method] ?? { count: 0, total: 0 };
      bucket.count += 1;
      bucket.total += total;
      byPaymentMethod[row.payment_method] = bucket;
    }
  }

  for (const method of Object.keys(byPaymentMethod)) {
    byPaymentMethod[method] = {
      count: byPaymentMethod[method]!.count,
      total: round2(byPaymentMethod[method]!.total),
    };
  }

  const totalOrders = rows.length;
  return {
    total_orders: totalOrders,
    total_revenue: round2(totalRevenue),
    average_order_value: totalOrders > 0 ? round2(totalRevenue / totalOrders) : 0,
    by_status: byStatus,
    by_payment_method: byPaymentMethod,
  };
}

export class FinancialSummaryService {
  constructor(private readonly repo: OrderRepository) {}

  async summarize(filter: FinancialSummaryFilter): Promise<FinancialSummary> {
    const rows = await this.repo.findFinancialRows(filter);
    return aggregateFinancialSummary(rows);
  }
}
