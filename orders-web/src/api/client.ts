import { FinancialSummary, Order, OrdersPage } from "../types/order";

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000").replace(
  /\/+$/,
  ""
);

/** Erro HTTP com o corpo (ja parseado, quando possivel) devolvido pela API. */
export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export type QueryParams = Record<string, string | number | undefined>;

/** Monta a query string preservando chaves com ponto (ex.: "customer.id"). */
export function buildQuery(params: QueryParams): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export interface ApiCallResult {
  url: string;
  status: number;
  ok: boolean;
  durationMs: number;
  /** Corpo parseado como JSON; null se a resposta nao teve corpo/nao era JSON. */
  body: unknown;
}

/**
 * Chamada "crua" para qualquer endpoint da API, usada pelo API Playground:
 * nunca lanca por causa do status HTTP, so por falha de rede/parse.
 */
export async function callApi(path: string, params: QueryParams = {}): Promise<ApiCallResult> {
  const url = `${API_BASE_URL}${path}${buildQuery(params)}`;
  const start = performance.now();
  const response = await fetch(url);
  const durationMs = performance.now() - start;

  let body: unknown = null;
  const text = await response.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  return { url, status: response.status, ok: response.ok, durationMs, body };
}

/** Mesma chamada, mas lanca ApiError quando o status nao e 2xx (uso com react-query). */
async function callApiOrThrow(path: string, params: QueryParams = {}): Promise<unknown> {
  const result = await callApi(path, params);
  if (!result.ok) {
    const message =
      (typeof result.body === "object" && result.body && "error" in result.body
        ? String((result.body as { error: unknown }).error)
        : undefined) ?? `Erro HTTP ${result.status}`;
    throw new ApiError(result.status, message, result.body);
  }
  return result.body;
}

export interface OrdersFilterParams {
  "customer.id"?: string;
  "product.id"?: string;
  "seller.id"?: string;
  status?: string;
  page?: number;
  page_size?: number;
  sort?: string;
}

export function fetchOrders(params: OrdersFilterParams): Promise<OrdersPage> {
  return callApiOrThrow("/orders", params as QueryParams) as Promise<OrdersPage>;
}

export function fetchOrderByUuid(uuid: string): Promise<Order> {
  return callApiOrThrow(`/orders/${encodeURIComponent(uuid)}`) as Promise<Order>;
}

export function fetchOrderItems(uuid: string): Promise<{ items: Order["items"] }> {
  return callApiOrThrow(`/orders/${encodeURIComponent(uuid)}/items`) as Promise<{
    items: Order["items"];
  }>;
}

export interface FinancialSummaryParams {
  "seller.id"?: string;
  start_date?: string;
  end_date?: string;
}

export function fetchFinancialSummary(params: FinancialSummaryParams): Promise<FinancialSummary> {
  return callApiOrThrow("/orders/financial-summary", params as QueryParams) as Promise<FinancialSummary>;
}

export function fetchHealth(): Promise<{ status: string }> {
  return callApiOrThrow("/health") as Promise<{ status: string }>;
}
