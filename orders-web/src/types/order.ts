// Espelha o contrato de resposta da orders-api (src/types/order.ts la).
// Duplicado deliberadamente: orders-web e um cliente HTTP independente, nao
// compartilha build com a API.

export const ORDER_STATUSES = ["created", "paid", "shipped", "delivered", "canceled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface Customer {
  id: number;
  name: string;
  email: string | null;
  document: string | null;
}

export interface Seller {
  id: number;
  name: string;
  city: string | null;
  state: string | null;
}

export interface Category {
  id: string;
  name: string;
  sub_category?: Category;
}

export interface Product {
  id: string;
  title: string;
}

export interface OrderItem {
  id: number;
  product: Product;
  unit_price: number;
  quantity: number;
  category: Category | null;
  total: number;
}

export interface Shipment {
  carrier: string | null;
  service: string | null;
  status: string | null;
  tracking_code: string | null;
}

export interface Payment {
  method: string | null;
  status: string | null;
  transaction_id: string | null;
}

export interface OrderMetadata {
  source: string | null;
  user_agent: string | null;
  ip_address: string | null;
}

export interface Order {
  uuid: string;
  created_at: string;
  channel: string | null;
  total: number;
  status: string;
  customer: Customer;
  seller: Seller | null;
  items: OrderItem[];
  shipment: Shipment | null;
  payment: Payment | null;
  metadata: OrderMetadata | null;
}

export interface OrdersPage {
  data: Order[];
  pagination: {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
  };
  sort: string;
}

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
