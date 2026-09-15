import { z } from "zod";
import { config } from "../config";
import { HttpError } from "../utils/httpError";

export interface Pagination {
  page: number;
  pageSize: number;
  offset: number;
}

const positiveIntString = z
  .string()
  .regex(/^\d+$/, "deve ser um inteiro positivo");

const paginationSchema = z.object({
  page: positiveIntString.optional(),
  page_size: positiveIntString.optional(),
});

/** Le e valida `page`/`page_size` da querystring, aplicando defaults e teto configurados. */
export function parsePagination(query: Record<string, unknown>): Pagination {
  const result = paginationSchema.safeParse(query);
  if (!result.success) {
    throw HttpError.badRequest(
      "Parametros de paginacao invalidos",
      result.error.flatten().fieldErrors
    );
  }

  const page = result.data.page ? Number.parseInt(result.data.page, 10) : 1;
  const requestedSize = result.data.page_size
    ? Number.parseInt(result.data.page_size, 10)
    : config.pagination.defaultPageSize;

  if (page < 1) {
    throw HttpError.badRequest("page deve ser >= 1");
  }
  if (requestedSize < 1) {
    throw HttpError.badRequest("page_size deve ser >= 1");
  }

  const pageSize = Math.min(requestedSize, config.pagination.maxPageSize);
  return { page, pageSize, offset: (page - 1) * pageSize };
}
