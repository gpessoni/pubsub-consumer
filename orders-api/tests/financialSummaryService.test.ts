import { describe, expect, it } from "vitest";
import { aggregateFinancialSummary } from "../src/services/financialSummaryService";

describe("aggregateFinancialSummary", () => {
  it("retorna zeros quando nao ha pedidos", () => {
    const summary = aggregateFinancialSummary([]);
    expect(summary.total_orders).toBe(0);
    expect(summary.total_revenue).toBe(0);
    expect(summary.average_order_value).toBe(0);
    expect(summary.by_status).toEqual({
      created: 0,
      paid: 0,
      shipped: 0,
      delivered: 0,
      canceled: 0,
    });
    expect(summary.by_payment_method.pix).toEqual({ count: 0, total: 0 });
  });

  it("agrega total, contagem por status e por metodo de pagamento", () => {
    const summary = aggregateFinancialSummary([
      { status: "paid", payment_method: "pix", total: "5000.00" },
      { status: "delivered", payment_method: "credit_card", total: "2500.50" },
      { status: "paid", payment_method: "pix", total: "1000.00" },
      { status: "canceled", payment_method: null, total: "0" },
    ]);

    expect(summary.total_orders).toBe(4);
    expect(summary.total_revenue).toBe(8500.5);
    expect(summary.average_order_value).toBe(2125.13);
    expect(summary.by_status).toMatchObject({ paid: 2, delivered: 1, canceled: 1, created: 0, shipped: 0 });
    expect(summary.by_payment_method.pix).toEqual({ count: 2, total: 6000 });
    expect(summary.by_payment_method.credit_card).toEqual({ count: 1, total: 2500.5 });
    expect(summary.by_payment_method.boleto).toEqual({ count: 0, total: 0 });
  });

  it("ignora pedidos sem metodo de pagamento na quebra by_payment_method", () => {
    const summary = aggregateFinancialSummary([{ status: "created", payment_method: null, total: "100" }]);
    expect(summary.by_payment_method.pix.count).toBe(0);
    expect(summary.total_revenue).toBe(100);
  });
});
