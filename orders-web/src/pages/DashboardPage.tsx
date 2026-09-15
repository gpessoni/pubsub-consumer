import { FormEvent, useState } from "react";
import { BarChart } from "../components/BarChart";
import { JsonViewer } from "../components/JsonViewer";
import { StatTile } from "../components/StatTile";
import { ErrorBox, LoadingBox } from "../components/StateBox";
import { FinancialSummaryParams } from "../api/client";
import { useFinancialSummaryQuery } from "../hooks/queries";
import { ApiError } from "../api/client";
import {
  formatCurrency,
  formatCurrencyCompact,
  formatInteger,
  paymentMethodLabel,
  statusLabel,
} from "../utils/format";

export function DashboardPage() {
  const [draft, setDraft] = useState<FinancialSummaryParams>({});
  const [filters, setFilters] = useState<FinancialSummaryParams>({});
  const [showRaw, setShowRaw] = useState(false);

  const { data, isLoading, isError, error, isFetching } = useFinancialSummaryQuery(filters);

  function applyFilters(e: FormEvent) {
    e.preventDefault();
    setFilters(draft);
  }

  function clearFilters() {
    setDraft({});
    setFilters({});
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Dashboard financeiro</h1>
          <p>Agregado de /orders/financial-summary - recalculado dinamicamente a partir dos items de cada pedido.</p>
        </div>
      </div>

      <form className="filter-row" onSubmit={applyFilters}>
        <div className="field">
          <label htmlFor="seller-id">ID do vendedor</label>
          <input
            id="seller-id"
            type="number"
            min={1}
            placeholder="ex.: 55"
            value={draft["seller.id"] ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, "seller.id": e.target.value || undefined }))}
          />
        </div>
        <div className="field">
          <label htmlFor="start-date">Data inicial</label>
          <input
            id="start-date"
            type="date"
            value={draft.start_date ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, start_date: e.target.value || undefined }))}
          />
        </div>
        <div className="field">
          <label htmlFor="end-date">Data final</label>
          <input
            id="end-date"
            type="date"
            value={draft.end_date ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, end_date: e.target.value || undefined }))}
          />
        </div>
        <button type="submit" className="btn btn--primary">
          Aplicar filtros
        </button>
        <button type="button" className="btn" onClick={clearFilters}>
          Limpar
        </button>
        {isFetching && !isLoading && <span className="muted">atualizando...</span>}
      </form>

      {isLoading && <LoadingBox />}
      {isError && <ErrorBox message={error instanceof ApiError ? error.message : "falha ao carregar"} />}

      {data && (
        <>
          <div className="grid grid--kpi">
            <StatTile label="Total de pedidos" value={formatInteger(data.total_orders)} />
            <StatTile label="Receita total" value={formatCurrencyCompact(data.total_revenue)} />
            <StatTile label="Ticket medio" value={formatCurrency(data.average_order_value)} />
          </div>

          <div className="grid grid--charts" style={{ marginTop: 16 }}>
            <div className="card">
              <h2>Pedidos por status</h2>
              <BarChart
                ariaLabel="Quantidade de pedidos por status"
                color="var(--series-1)"
                data={Object.entries(data.by_status).map(([status, count]) => ({
                  label: statusLabel(status),
                  value: count,
                }))}
                formatValue={(v) => formatInteger(v)}
              />
            </div>

            <div className="card">
              <h2>Pedidos por metodo de pagamento</h2>
              <BarChart
                ariaLabel="Quantidade de pedidos por metodo de pagamento"
                color="var(--series-3)"
                data={Object.entries(data.by_payment_method).map(([method, breakdown]) => ({
                  label: paymentMethodLabel(method),
                  value: breakdown.count,
                }))}
                formatValue={(v) => formatInteger(v)}
              />
            </div>

            <div className="card">
              <h2>Receita por metodo de pagamento</h2>
              <BarChart
                ariaLabel="Receita total por metodo de pagamento"
                color="var(--series-2)"
                data={Object.entries(data.by_payment_method).map(([method, breakdown]) => ({
                  label: paymentMethodLabel(method),
                  value: breakdown.total,
                }))}
                formatValue={(v) => formatCurrencyCompact(v)}
              />
            </div>

            <div className="card">
              <h2>Ticket medio por metodo de pagamento</h2>
              <BarChart
                ariaLabel="Ticket medio por metodo de pagamento"
                color="var(--series-4)"
                data={Object.entries(data.by_payment_method).map(([method, breakdown]) => ({
                  label: paymentMethodLabel(method),
                  value: breakdown.count > 0 ? breakdown.total / breakdown.count : 0,
                }))}
                formatValue={(v) => formatCurrencyCompact(v)}
              />
            </div>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <h2>Detalhamento por metodo de pagamento</h2>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Metodo</th>
                    <th className="num">Pedidos</th>
                    <th className="num">Total</th>
                    <th className="num">Ticket medio</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(data.by_payment_method).map(([method, breakdown]) => (
                    <tr key={method}>
                      <td>{paymentMethodLabel(method)}</td>
                      <td className="num">{formatInteger(breakdown.count)}</td>
                      <td className="num">{formatCurrency(breakdown.total)}</td>
                      <td className="num">
                        {formatCurrency(breakdown.count > 0 ? breakdown.total / breakdown.count : 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <button type="button" className="btn btn--ghost" onClick={() => setShowRaw((v) => !v)}>
              {showRaw ? "Ocultar" : "Ver"} resposta bruta (JSON)
            </button>
            {showRaw && (
              <div style={{ marginTop: 10 }}>
                <JsonViewer data={data} />
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
