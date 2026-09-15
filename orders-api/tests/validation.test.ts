import { describe, expect, it } from "vitest";
import { parsePagination } from "../src/validation/pagination";
import { parseSort } from "../src/validation/sorting";
import { parseOrdersFilter } from "../src/validation/ordersFilter";
import { parseFinancialSummaryFilter } from "../src/validation/financialSummaryFilter";
import { HttpError } from "../src/utils/httpError";

describe("parsePagination", () => {
  it("usa defaults quando nada e informado", () => {
    const p = parsePagination({});
    expect(p).toEqual({ page: 1, pageSize: 20, offset: 0 });
  });

  it("calcula offset a partir de page/page_size", () => {
    const p = parsePagination({ page: "3", page_size: "10" });
    expect(p).toEqual({ page: 3, pageSize: 10, offset: 20 });
  });

  it("limita page_size ao teto configurado", () => {
    const p = parsePagination({ page_size: "9999" });
    expect(p.pageSize).toBe(100);
  });

  it("rejeita page invalido", () => {
    expect(() => parsePagination({ page: "abc" })).toThrow(HttpError);
    expect(() => parsePagination({ page: "0" })).toThrow(HttpError);
  });
});

describe("parseSort", () => {
  it("default e -created_at (mais recentes primeiro)", () => {
    expect(parseSort(undefined)).toEqual({ field: "created_at", direction: "DESC", raw: "-created_at" });
  });

  it("aceita created_at ascendente", () => {
    expect(parseSort("created_at")).toEqual({ field: "created_at", direction: "ASC", raw: "created_at" });
  });

  it("rejeita campo desconhecido", () => {
    expect(() => parseSort("total")).toThrow(HttpError);
  });
});

describe("parseOrdersFilter", () => {
  it("le filtros com notacao de ponto", () => {
    const filter = parseOrdersFilter({ "customer.id": "49494", "seller.id": "55", status: "paid" });
    expect(filter).toEqual({ customerId: 49494, sellerId: 55, status: "paid", productId: undefined });
  });

  it("rejeita status fora do enum", () => {
    expect(() => parseOrdersFilter({ status: "invalido" })).toThrow(HttpError);
  });

  it("rejeita customer.id nao numerico", () => {
    expect(() => parseOrdersFilter({ "customer.id": "abc" })).toThrow(HttpError);
  });
});

describe("parseFinancialSummaryFilter", () => {
  it("aceita seller.id e intervalo de datas", () => {
    const filter = parseFinancialSummaryFilter({
      "seller.id": "55",
      start_date: "2025-01-01",
      end_date: "2025-12-31",
    });
    expect(filter.sellerId).toBe(55);
    expect(filter.startDate?.toISOString()).toContain("2025-01-01");
    expect(filter.endDate?.toISOString()).toContain("2025-12-31");
  });

  it("rejeita start_date depois de end_date", () => {
    expect(() =>
      parseFinancialSummaryFilter({ start_date: "2025-12-31", end_date: "2025-01-01" })
    ).toThrow(HttpError);
  });

  it("rejeita data invalida", () => {
    expect(() => parseFinancialSummaryFilter({ start_date: "nao-e-data" })).toThrow(HttpError);
  });
});
