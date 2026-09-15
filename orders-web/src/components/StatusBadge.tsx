import { statusLabel } from "../utils/format";

const TONE_BY_STATUS: Record<string, "good" | "critical" | "warning" | undefined> = {
  delivered: "good",
  canceled: "critical",
  created: "warning",
};

/** Badge de status do pedido. Cor + icone (bolinha) + label, nunca so cor. */
export function StatusBadge({ status }: { status: string }) {
  const tone = TONE_BY_STATUS[status];
  return (
    <span className={`badge${tone ? ` badge--${tone}` : ""}`}>
      <span className="badge__dot" aria-hidden="true" />
      {statusLabel(status)}
    </span>
  );
}
