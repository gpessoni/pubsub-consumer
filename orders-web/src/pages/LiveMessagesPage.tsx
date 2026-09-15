import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError } from "../api/client";
import { ErrorBox, LoadingBox } from "../components/StateBox";
import { StatusBadge } from "../components/StatusBadge";
import { useLiveOrdersQuery } from "../hooks/queries";
import { formatCurrency, formatDateTime } from "../utils/format";

export function LiveMessagesPage() {
  const [isLive, setIsLive] = useState(true);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const knownIds = useRef<Set<string> | null>(null);
  const { data, isLoading, isError, error, dataUpdatedAt } = useLiveOrdersQuery(isLive);

  useEffect(() => {
    if (!data) return;

    const currentIds = new Set(data.data.map((order) => order.uuid));
    if (knownIds.current) {
      const arrivals = data.data.filter((order) => !knownIds.current?.has(order.uuid)).map((order) => order.uuid);
      if (arrivals.length > 0) {
        setNewIds(new Set(arrivals));
        const timer = window.setTimeout(() => setNewIds(new Set()), 4_000);
        knownIds.current = currentIds;
        return () => window.clearTimeout(timer);
      }
    }
    knownIds.current = currentIds;
  }, [data]);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Mensagens ao vivo</h1>
          <p>Acompanhe os pedidos persistidos pelo consumidor, com atualização automática a cada 2 segundos.</p>
        </div>
      </div>

      <div className="card live-toolbar">
        <div className="live-status" aria-live="polite">
          <span className={`live-status__pulse${isLive ? "" : " live-status__pulse--paused"}`} aria-hidden="true" />
          <span>
            <strong>{isLive ? "Monitorando" : "Monitoramento pausado"}</strong>
            {dataUpdatedAt > 0 && <span> · última leitura {new Date(dataUpdatedAt).toLocaleTimeString("pt-BR")}</span>}
          </span>
        </div>
        <button type="button" className={`btn${isLive ? "" : " btn--primary"}`} onClick={() => setIsLive((value) => !value)}>
          {isLive ? "Pausar" : "Retomar"}
        </button>
      </div>

      {isLoading && <LoadingBox />}
      {isError && <ErrorBox message={error instanceof ApiError ? error.message : "falha ao buscar mensagens"} />}

      {data && (
        <div className="message-feed" aria-live="polite">
          {data.data.length === 0 && <div className="card state-box">Aguardando a primeira mensagem...</div>}
          {data.data.map((order) => (
            <Link
              className={`message-card${newIds.has(order.uuid) ? " message-card--new" : ""}`}
              key={order.uuid}
              to={`/orders/${encodeURIComponent(order.uuid)}`}
            >
              <div>
                <span className="message-card__label">Recebida em</span>
                <span className="message-card__value">{formatDateTime(order.created_at)}</span>
                <div className="message-card__meta">{order.channel ?? "Canal não informado"}</div>
              </div>
              <div>
                <span className="message-card__label">Pedido</span>
                <span className="message-card__value" title={order.uuid}>{order.uuid}</span>
                <div className="message-card__meta">{order.customer.name}</div>
              </div>
              <div>
                <span className="message-card__label">Valor</span>
                <span className="message-card__value">{formatCurrency(order.total)}</span>
                <div className="message-card__meta">{order.items.length} {order.items.length === 1 ? "item" : "itens"}</div>
              </div>
              <div>
                <span className="message-card__label">Status</span>
                <StatusBadge status={order.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
