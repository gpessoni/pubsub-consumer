import { FormEvent, useMemo, useState } from "react";
import { ApiCallResult, API_BASE_URL, QueryParams, buildQuery, callApi } from "../api/client";
import { JsonViewer } from "../components/JsonViewer";
import { ORDER_STATUSES } from "../types/order";

interface FieldDef {
  name: string;
  label: string;
  type: "text" | "number" | "date" | "select";
  placeholder?: string;
  options?: { value: string; label: string }[];
}

interface EndpointDef {
  key: string;
  label: string;
  description: string;
  fields: FieldDef[];
  buildRequest: (values: Record<string, string>) => { path: string; params: QueryParams };
}

const STATUS_OPTIONS = [{ value: "", label: "(todos)" }, ...ORDER_STATUSES.map((s) => ({ value: s, label: s }))];

const ENDPOINTS: EndpointDef[] = [
  {
    key: "list",
    label: "GET /orders",
    description: "Lista paginada de pedidos, com filtros e ordenacao.",
    fields: [
      { name: "customer.id", label: "customer.id", type: "number", placeholder: "7788" },
      { name: "product.id", label: "product.id", type: "text", placeholder: "abc-1344" },
      { name: "seller.id", label: "seller.id", type: "number", placeholder: "55" },
      { name: "status", label: "status", type: "select", options: STATUS_OPTIONS },
      { name: "page", label: "page", type: "number", placeholder: "1" },
      { name: "page_size", label: "page_size", type: "number", placeholder: "20" },
      {
        name: "sort",
        label: "sort",
        type: "select",
        options: [
          { value: "", label: "(default: -created_at)" },
          { value: "-created_at", label: "-created_at" },
          { value: "created_at", label: "created_at" },
        ],
      },
    ],
    buildRequest: (v) => ({
      path: "/orders",
      params: {
        "customer.id": v["customer.id"],
        "product.id": v["product.id"],
        "seller.id": v["seller.id"],
        status: v.status,
        page: v.page,
        page_size: v.page_size,
        sort: v.sort,
      },
    }),
  },
  {
    key: "detail",
    label: "GET /orders/{uuid}",
    description: "Um pedido pelo uuid.",
    fields: [{ name: "uuid", label: "uuid", type: "text", placeholder: "ORD-2025-0001" }],
    buildRequest: (v) => ({ path: `/orders/${encodeURIComponent(v.uuid ?? "")}`, params: {} }),
  },
  {
    key: "items",
    label: "GET /orders/{uuid}/items",
    description: "Somente os items do pedido.",
    fields: [{ name: "uuid", label: "uuid", type: "text", placeholder: "ORD-2025-0001" }],
    buildRequest: (v) => ({ path: `/orders/${encodeURIComponent(v.uuid ?? "")}/items`, params: {} }),
  },
  {
    key: "summary",
    label: "GET /orders/financial-summary",
    description: "Agregado financeiro, com filtro por seller.id e intervalo de datas.",
    fields: [
      { name: "seller.id", label: "seller.id", type: "number", placeholder: "55" },
      { name: "start_date", label: "start_date", type: "date" },
      { name: "end_date", label: "end_date", type: "date" },
    ],
    buildRequest: (v) => ({
      path: "/orders/financial-summary",
      params: { "seller.id": v["seller.id"], start_date: v.start_date, end_date: v.end_date },
    }),
  },
  {
    key: "health",
    label: "GET /health",
    description: "Liveness check da API.",
    fields: [],
    buildRequest: () => ({ path: "/health", params: {} }),
  },
];

function statusTone(status: number): "good" | "warning" | "critical" {
  if (status >= 200 && status < 300) return "good";
  if (status >= 400 && status < 500) return "warning";
  return "critical";
}

export function ApiPlaygroundPage() {
  const [selectedKey, setSelectedKey] = useState(ENDPOINTS[0]!.key);
  const [values, setValues] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ApiCallResult | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const endpoint = useMemo(() => ENDPOINTS.find((e) => e.key === selectedKey) ?? ENDPOINTS[0]!, [selectedKey]);
  const preview = endpoint.buildRequest(values);
  const previewUrl = `${API_BASE_URL}${preview.path}${buildQuery(preview.params)}`;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setRequestError(null);
    try {
      const { path, params } = endpoint.buildRequest(values);
      const res = await callApi(path, params);
      setResult(res);
    } catch (err) {
      setRequestError(err instanceof Error ? err.message : "Falha na requisicao (rede?)");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>API Playground</h1>
          <p>Monte a requisicao, envie e inspecione a resposta bruta de qualquer endpoint da orders-api.</p>
        </div>
      </div>

      <div className="grid grid--2">
        <div className="card">
          <h2>Requisicao</h2>

          <div className="field" style={{ marginBottom: 12 }}>
            <label htmlFor="endpoint">Endpoint</label>
            <select
              id="endpoint"
              value={selectedKey}
              onChange={(e) => {
                setSelectedKey(e.target.value);
                setValues({});
                setResult(null);
                setRequestError(null);
              }}
            >
              {ENDPOINTS.map((ep) => (
                <option key={ep.key} value={ep.key}>
                  {ep.label}
                </option>
              ))}
            </select>
          </div>
          <p className="muted" style={{ marginTop: -6 }}>
            {endpoint.description}
          </p>

          <form onSubmit={handleSubmit}>
            {endpoint.fields.map((field) => (
              <div className="field" key={field.name} style={{ marginBottom: 10 }}>
                <label htmlFor={field.name}>{field.label}</label>
                {field.type === "select" ? (
                  <select
                    id={field.name}
                    value={values[field.name] ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
                  >
                    {field.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={field.name}
                    type={field.type}
                    placeholder={field.placeholder}
                    value={values[field.name] ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
                  />
                )}
              </div>
            ))}

            <div className="json-viewer" style={{ marginBottom: 12, fontSize: 11 }}>
              GET {previewUrl}
            </div>

            <button type="submit" className="btn btn--primary" disabled={loading}>
              {loading ? "Enviando..." : "Enviar"}
            </button>
          </form>
        </div>

        <div className="card">
          <h2>Resposta</h2>

          {requestError && <div className="state-box state-box--error">Falha de rede: {requestError}</div>}

          {!result && !requestError && <p className="muted">Envie uma requisicao para ver a resposta aqui.</p>}

          {result && (
            <>
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
                <span className={`badge badge--${statusTone(result.status)}`}>
                  <span className="badge__dot" aria-hidden="true" />
                  {result.status || "sem resposta"}
                </span>
                <span className="muted">{result.durationMs.toFixed(0)} ms</span>
                <span className="muted" style={{ wordBreak: "break-all" }}>
                  {result.url}
                </span>
              </div>
              <JsonViewer data={result.body} />
            </>
          )}
        </div>
      </div>
    </>
  );
}
