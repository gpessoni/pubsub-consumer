import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ApiError } from "../api/client";
import { JsonViewer } from "../components/JsonViewer";
import { StatusBadge } from "../components/StatusBadge";
import { ErrorBox, LoadingBox } from "../components/StateBox";
import { useOrderItemsQuery, useOrderQuery } from "../hooks/queries";
import { formatCurrency, formatDateTime } from "../utils/format";
import { Category } from "../types/order";

function categoryPath(category: Category | null): string {
  if (!category) return "-";
  return category.sub_category ? `${category.name} / ${category.sub_category.name}` : category.name;
}

export function OrderDetailPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const [showRaw, setShowRaw] = useState(false);
  const [showItemsEndpoint, setShowItemsEndpoint] = useState(false);

  const { data: order, isLoading, isError, error } = useOrderQuery(uuid);
  const itemsEndpoint = useOrderItemsQuery(showItemsEndpoint ? uuid : undefined);

  return (
    <>
      <div className="page-header">
        <div>
          <Link to="/orders">&larr; voltar para pedidos</Link>
          <h1 style={{ marginTop: 6 }}>{uuid}</h1>
        </div>
      </div>

      {isLoading && <LoadingBox />}
      {isError && (
        <ErrorBox
          message={
            error instanceof ApiError
              ? `${error.message}${error.status === 404 ? "" : ` (status ${error.status})`}`
              : "falha ao carregar"
          }
        />
      )}

      {order && (
        <>
          <div className="grid grid--2">
            <div className="card">
              <h3>Pedido</h3>
              <dl className="kv-list">
                <dt>Status</dt>
                <dd>
                  <StatusBadge status={order.status} />
                </dd>
                <dt>Criado em</dt>
                <dd>{formatDateTime(order.created_at)}</dd>
                <dt>Canal</dt>
                <dd>{order.channel ?? "-"}</dd>
                <dt>Total (calculado)</dt>
                <dd>{formatCurrency(order.total)}</dd>
              </dl>
            </div>

            <div className="card">
              <h3>Cliente</h3>
              <dl className="kv-list">
                <dt>ID</dt>
                <dd>{order.customer.id}</dd>
                <dt>Nome</dt>
                <dd>{order.customer.name}</dd>
                <dt>Email</dt>
                <dd>{order.customer.email ?? "-"}</dd>
                <dt>Documento</dt>
                <dd>{order.customer.document ?? "-"}</dd>
              </dl>
            </div>

            <div className="card">
              <h3>Vendedor</h3>
              {order.seller ? (
                <dl className="kv-list">
                  <dt>ID</dt>
                  <dd>{order.seller.id}</dd>
                  <dt>Nome</dt>
                  <dd>{order.seller.name}</dd>
                  <dt>Cidade/UF</dt>
                  <dd>
                    {order.seller.city ?? "-"} / {order.seller.state ?? "-"}
                  </dd>
                </dl>
              ) : (
                <p className="muted">Pedido sem vendedor.</p>
              )}
            </div>

            <div className="card">
              <h3>Pagamento</h3>
              {order.payment ? (
                <dl className="kv-list">
                  <dt>Metodo</dt>
                  <dd>{order.payment.method ?? "-"}</dd>
                  <dt>Status</dt>
                  <dd>{order.payment.status ?? "-"}</dd>
                  <dt>Transacao</dt>
                  <dd>{order.payment.transaction_id ?? "-"}</dd>
                </dl>
              ) : (
                <p className="muted">Sem dados de pagamento.</p>
              )}
            </div>

            <div className="card">
              <h3>Envio</h3>
              {order.shipment ? (
                <dl className="kv-list">
                  <dt>Transportadora</dt>
                  <dd>{order.shipment.carrier ?? "-"}</dd>
                  <dt>Servico</dt>
                  <dd>{order.shipment.service ?? "-"}</dd>
                  <dt>Status</dt>
                  <dd>{order.shipment.status ?? "-"}</dd>
                  <dt>Rastreio</dt>
                  <dd>{order.shipment.tracking_code ?? "-"}</dd>
                </dl>
              ) : (
                <p className="muted">Sem dados de envio.</p>
              )}
            </div>

            <div className="card">
              <h3>Metadata</h3>
              {order.metadata ? (
                <dl className="kv-list">
                  <dt>Origem</dt>
                  <dd>{order.metadata.source ?? "-"}</dd>
                  <dt>User-Agent</dt>
                  <dd style={{ wordBreak: "break-all" }}>{order.metadata.user_agent ?? "-"}</dd>
                  <dt>IP</dt>
                  <dd>{order.metadata.ip_address ?? "-"}</dd>
                </dl>
              ) : (
                <p className="muted">Sem metadata.</p>
              )}
            </div>
          </div>

          <div className="card">
            <h2>Items ({order.items.length})</h2>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Produto</th>
                    <th>Categoria</th>
                    <th className="num">Preco unit.</th>
                    <th className="num">Qtd</th>
                    <th className="num">Total (calculado)</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>
                        {item.product.title} <span className="muted">({item.product.id})</span>
                      </td>
                      <td>{categoryPath(item.category)}</td>
                      <td className="num">{formatCurrency(item.unit_price)}</td>
                      <td className="num">{item.quantity}</td>
                      <td className="num">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <button type="button" className="btn btn--ghost" onClick={() => setShowItemsEndpoint((v) => !v)}>
              {showItemsEndpoint ? "Ocultar" : "Testar"} GET /orders/{uuid}/items
            </button>
            {showItemsEndpoint && (
              <div style={{ marginTop: 10 }}>
                {itemsEndpoint.isLoading && <LoadingBox />}
                {itemsEndpoint.isError && (
                  <ErrorBox
                    message={itemsEndpoint.error instanceof ApiError ? itemsEndpoint.error.message : "falha"}
                  />
                )}
                {itemsEndpoint.data && <JsonViewer data={itemsEndpoint.data} />}
              </div>
            )}
          </div>

          <div className="card">
            <button type="button" className="btn btn--ghost" onClick={() => setShowRaw((v) => !v)}>
              {showRaw ? "Ocultar" : "Ver"} payload completo (JSON)
            </button>
            {showRaw && (
              <div style={{ marginTop: 10 }}>
                <JsonViewer data={order} />
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
