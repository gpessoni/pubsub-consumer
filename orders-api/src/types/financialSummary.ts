export interface PaymentMethodBreakdown {
  count: number;
  total: number;
}

export interface FinancialSummary {
  total_orders: number;
  total_revenue: number;
  average_order_value: number;
  by_status: Record<string, number>;
  by_payment_method: Record<string, PaymentMethodBreakdown>;
}
