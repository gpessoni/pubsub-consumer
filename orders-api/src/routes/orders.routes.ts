import { Router } from "express";
import { OrderService } from "../services/orderService";
import { FinancialSummaryService } from "../services/financialSummaryService";
import { asyncHandler } from "../middleware/asyncHandler";
import { HttpError } from "../utils/httpError";
import { parsePagination } from "../validation/pagination";
import { parseSort } from "../validation/sorting";
import { parseOrdersFilter } from "../validation/ordersFilter";
import { parseFinancialSummaryFilter } from "../validation/financialSummaryFilter";

export function createOrdersRouter(
  orderService: OrderService,
  financialSummaryService: FinancialSummaryService
): Router {
  const router = Router();

  // IMPORTANTE: precisa vir antes de GET /:uuid, senao "financial-summary"
  // seria interpretado como um uuid de pedido.
  router.get(
    "/financial-summary",
    asyncHandler(async (req, res) => {
      const filter = parseFinancialSummaryFilter(req.query as Record<string, unknown>);
      const summary = await financialSummaryService.summarize(filter);
      res.json(summary);
    })
  );

  router.get(
    "/",
    asyncHandler(async (req, res) => {
      const filter = parseOrdersFilter(req.query as Record<string, unknown>);
      const pagination = parsePagination(req.query as Record<string, unknown>);
      const sort = parseSort(req.query.sort);

      const { orders, totalCount } = await orderService.list(filter, pagination, sort);

      res.json({
        data: orders,
        pagination: {
          page: pagination.page,
          page_size: pagination.pageSize,
          total_items: totalCount,
          total_pages: Math.ceil(totalCount / pagination.pageSize),
        },
        sort: sort.raw,
      });
    })
  );

  router.get(
    "/:uuid",
    asyncHandler(async (req, res) => {
      const uuid = requireUuidParam(req.params.uuid);
      const order = await orderService.getByUuid(uuid);
      if (!order) {
        throw HttpError.notFound(`Pedido nao encontrado: ${uuid}`);
      }
      res.json(order);
    })
  );

  router.get(
    "/:uuid/items",
    asyncHandler(async (req, res) => {
      const uuid = requireUuidParam(req.params.uuid);
      const items = await orderService.getItems(uuid);
      if (!items) {
        throw HttpError.notFound(`Pedido nao encontrado: ${uuid}`);
      }
      res.json({ items });
    })
  );

  return router;
}

/** `req.params.uuid` sempre existe quando a rota `:uuid` casa; so satisfaz o TS. */
function requireUuidParam(uuid: string | undefined): string {
  if (!uuid) {
    throw HttpError.badRequest("uuid do pedido e obrigatorio");
  }
  return uuid;
}
