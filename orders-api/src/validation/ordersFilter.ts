import { z } from "zod";
import { HttpError } from "../utils/httpError";
import { ORDER_STATUSES, OrderStatus } from "../types/order";

export interface OrdersFilter {
  customerId?: number;
  productId?: string;
  sellerId?: number;
  status?: OrderStatus;
}

const positiveIntString = z.string().regex(/^\d+$/, "deve ser um inteiro positivo");

// Chaves usam notacao com ponto (ex.: `customer.id=49494`), conforme o
// enunciado. O Express (qs) preserva "customer.id" como uma chave literal
// quando `allowDots` nao esta habilitado, entao lemos assim mesmo.
const filterSchema = z.object({
  "customer.id": positiveIntString.optional(),
  "product.id": z.string().min(1).optional(),
  "seller.id": positiveIntString.optional(),
  status: z.enum(ORDER_STATUSES).optional(),
});

export function parseOrdersFilter(query: Record<string, unknown>): OrdersFilter {
  const result = filterSchema.safeParse(query);
  if (!result.success) {
    throw HttpError.badRequest("Filtros invalidos", result.error.flatten().fieldErrors);
  }

  const data = result.data;
  return {
    customerId: data["customer.id"] ? Number.parseInt(data["customer.id"], 10) : undefined,
    productId: data["product.id"],
    sellerId: data["seller.id"] ? Number.parseInt(data["seller.id"], 10) : undefined,
    status: data.status,
  };
}
