import { useQuery } from "@tanstack/react-query";
import {
  FinancialSummaryParams,
  OrdersFilterParams,
  fetchFinancialSummary,
  fetchHealth,
  fetchOrderByUuid,
  fetchOrderItems,
  fetchOrders,
} from "../api/client";

export function useOrdersQuery(params: OrdersFilterParams) {
  return useQuery({
    queryKey: ["orders", params],
    queryFn: () => fetchOrders(params),
    placeholderData: (previous) => previous, // mantem a tabela durante o refetch (sem "flash")
  });
}

export function useLiveOrdersQuery(enabled = true) {
  return useQuery({
    queryKey: ["orders", "live"],
    queryFn: () => fetchOrders({ page: 1, page_size: 20, sort: "-created_at" }),
    refetchInterval: enabled ? 2_000 : false,
    refetchIntervalInBackground: true,
    retry: 1,
  });
}

export function useOrderQuery(uuid: string | undefined) {
  return useQuery({
    queryKey: ["order", uuid],
    queryFn: () => fetchOrderByUuid(uuid as string),
    enabled: Boolean(uuid),
  });
}

export function useOrderItemsQuery(uuid: string | undefined) {
  return useQuery({
    queryKey: ["order-items", uuid],
    queryFn: () => fetchOrderItems(uuid as string),
    enabled: Boolean(uuid),
  });
}

export function useFinancialSummaryQuery(params: FinancialSummaryParams) {
  return useQuery({
    queryKey: ["financial-summary", params],
    queryFn: () => fetchFinancialSummary(params),
    placeholderData: (previous) => previous,
  });
}

export function useHealthQuery() {
  return useQuery({
    queryKey: ["health"],
    queryFn: fetchHealth,
    retry: false,
    refetchInterval: 15_000,
  });
}
