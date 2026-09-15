import { useState } from "react";

interface JsonViewerProps {
  data: unknown;
}

/** Visualizacao de JSON bruto com botao de copiar (para inspecionar respostas da API). */
export function JsonViewer({ data }: JsonViewerProps) {
  const [copied, setCopied] = useState(false);
  const text = typeof data === "string" ? data : JSON.stringify(data, null, 2);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard indisponivel (ex.: contexto sem permissao) - ignora silenciosamente
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 6 }}>
        <button type="button" className="btn btn--ghost" onClick={handleCopy}>
          {copied ? "Copiado!" : "Copiar JSON"}
        </button>
      </div>
      <pre className="json-viewer">{text}</pre>
    </div>
  );
}
