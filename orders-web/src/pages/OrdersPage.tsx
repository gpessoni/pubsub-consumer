import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError, OrdersFilterParams } from "../api/client";
import { Pagination } from "../components/Pagination";
import { StatusBadge } from "../components/StatusBadge";
import { EmptyBox, ErrorBox, LoadingBox } from "../components/StateBox";
import { useOrdersQuery } from "../hooks/queries";
import { formatCurrency, formatDateTime } from "../utils/format";
import { ORDER_STATUSES } from "../types/order";

interface FilterDraft {
  customerId: string;
  productId: string;
  sellerId: string;
  status: string;
}

const EMPTY_DRAFT: FilterDraft = { customerId: "", productId: "", sellerId: "", status: "" };

export function OrdersPage() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<FilterDraft>(EMPTY_DRAFT);
  const [filters, setFilters] = useState<FilterDraft>(EMPTY_DRAFT);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sort, setSort] = useState<"-created_at" | "created_at">("-created_at");

  const params: OrdersFilterParams = {
    "customer.id": filters.customerId || undefined,
    "product.id": filters.productId || undefined,
    "seller.id": filters.sellerId || undefined,
    status: filters.status || undefined,
    page,
    page_size: pageSize,
    sort,
  };

  const { data, isLoading, isError, error, isFetching } = useOrdersQuery(params);

  function applyFilters(e: FormEvent) {
    e.preventDefault();
    setFilters(draft);
    setPage(1);
  }

  function clearFilters() {
    setDraft(EMPTY_DRAFT);
    setFilters(EMPTY_DRAFT);
    setPage(1);
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Pedidos</h1>
          <p>Listagem paginada de /orders, com filtros e ordenacao por data.</p>
        </div>
      </div>

      <form className="filter-row" onSubmit={applyFilters}>
        <div className="filter-row__group">
          <div className="field">
            <label htmlFor="customer-id">ID do cliente</label>
            <input
              id="customer-id"
              type="number"
              min={1}
              placeholder="ex.: 7788"
              value={draft.customerId}
              onChange={(e) => setDraft((d) => ({ ...d, customerId: e.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="product-id">ID do produto</label>
            <input
              id="product-id"
              type="text"
              placeholder="ex.: abc-1344"
              value={draft.productId}
              onChange={(e) => setDraft((d) => ({ ...d, productId: e.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="seller-id">ID do vendedor</label>
            <input
              id="seller-id"
              type="number"
              min={1}
              placeholder="ex.: 55"
              value={draft.sellerId}
              onChange={(e) => setDraft((d) => ({ ...d, sellerId: e.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              value={draft.status}
              onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}
            >
              <option value="">Todos</option>
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn--primary">
            Filtrar
          </button>
          <button type="button" className="btn" onClick={clearFilters}>
            Limpar
          </button>
          {isFetching && !isLoading && <span className="muted">atualizando...</span>}
        </div>

        <div className="filter-row__divider" />

        <div className="filter-row__group">
          <div className="field">
            <label htmlFor="sort">Ordenar por data</label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as "-created_at" | "created_at")}
            >
              <option value="-created_at">Mais recentes primeiro</option>
              <option value="created_at">Mais antigos primeiro</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="page-size">Por pagina</label>
            <select
              id="page-size"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
            >
              {[10, 20, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>
      </form>

      {isLoading && <LoadingBox />}
      {isError && <ErrorBox message={error instanceof ApiError ? error.message : "falha ao carregar"} />}

      {data && data.data.length === 0 && <EmptyBox />}

      {data && data.data.length > 0 && (
        <>
          <div className="card">
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>UUID</th>
                    <th>Criado em</th>
                    <th>Status</th>
                    <th>Canal</th>
                    <th>Cliente</th>
                    <th>Vendedor</th>
                    <th className="num">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((order) => (
                    <tr key={order.uuid} onClick={() => navigate(`/orders/${encodeURIComponent(order.uuid)}`)}>
                      <td>{order.uuid}</td>
                      <td>{formatDateTime(order.created_at)}</td>
                      <td>
                        <StatusBadge status={order.status} />
                      </td>
                      <td>{order.channel ?? "-"}</td>
                      <td>{order.customer.name}</td>
                      <td>{order.seller?.name ?? "-"}</td>
                      <td className="num">{formatCurrency(order.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Pagination
            page={data.pagination.page}
            totalPages={data.pagination.total_pages}
            totalItems={data.pagination.total_items}
            onPageChange={setPage}
          />
        </>
      )}
    </>
  );
}
