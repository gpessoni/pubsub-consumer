import { z } from "zod";
import { HttpError } from "../utils/httpError";

export interface FinancialSummaryFilter {
  sellerId?: number;
  /** Inicio do intervalo (inclusive), em UTC. */
  startDate?: Date;
  /** Fim do intervalo (inclusive), em UTC. */
  endDate?: Date;
}

const positiveIntString = z.string().regex(/^\d+$/, "deve ser um inteiro positivo");
// Aceita "YYYY-MM-DD" ou um ISO-8601 completo (ex.: "2025-10-01T10:15:00Z").
const dateString = z.string().refine((v) => !Number.isNaN(Date.parse(v)), {
  message: "data invalida, use YYYY-MM-DD ou ISO-8601",
});

const filterSchema = z
  .object({
    "seller.id": positiveIntString.optional(),
    start_date: dateString.optional(),
    end_date: dateString.optional(),
  })
  .refine(
    (data) =>
      !data.start_date || !data.end_date || Date.parse(data.start_date) <= Date.parse(data.end_date),
    { message: "start_date deve ser anterior ou igual a end_date", path: ["start_date"] }
  );

export function parseFinancialSummaryFilter(query: Record<string, unknown>): FinancialSummaryFilter {
  const result = filterSchema.safeParse(query);
  if (!result.success) {
    throw HttpError.badRequest("Filtros invalidos", result.error.flatten().fieldErrors);
  }

  const data = result.data;
  return {
    sellerId: data["seller.id"] ? Number.parseInt(data["seller.id"], 10) : undefined,
    startDate: data.start_date ? new Date(data.start_date) : undefined,
    endDate: data.end_date ? new Date(data.end_date) : undefined,
  };
}
