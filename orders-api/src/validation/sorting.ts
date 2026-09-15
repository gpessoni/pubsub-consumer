import { HttpError } from "../utils/httpError";

export type SortDirection = "ASC" | "DESC";

export interface Sort {
  field: "created_at";
  direction: SortDirection;
  /** Representacao normalizada, ex.: "-created_at" (usada na resposta). */
  raw: string;
}

/** Campos ordenaveis suportados hoje. Facil de estender no futuro. */
const SORTABLE_FIELDS = new Set(["created_at"]);

/**
 * Aceita `sort=created_at` (ascendente) ou `sort=-created_at` (descendente,
 * prefixo `-`). Default: `-created_at` (mais recentes primeiro).
 */
export function parseSort(sortParam: unknown): Sort {
  if (sortParam === undefined) {
    return { field: "created_at", direction: "DESC", raw: "-created_at" };
  }

  if (typeof sortParam !== "string") {
    throw HttpError.badRequest("sort deve ser uma string");
  }

  const descending = sortParam.startsWith("-");
  const field = descending ? sortParam.slice(1) : sortParam;

  if (!SORTABLE_FIELDS.has(field)) {
    throw HttpError.badRequest(
      `sort invalido: "${sortParam}". Campos suportados: ${Array.from(SORTABLE_FIELDS).join(", ")}`
    );
  }

  return {
    field: field as Sort["field"],
    direction: descending ? "DESC" : "ASC",
    raw: sortParam,
  };
}
