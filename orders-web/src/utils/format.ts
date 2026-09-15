const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const compactCurrencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});

const integerFormatter = new Intl.NumberFormat("pt-BR");

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

/** Versao compacta (ex.: R$ 4,2 mi) para caber em stat tiles. */
export function formatCurrencyCompact(value: number): string {
  return compactCurrencyFormatter.format(value);
}

export function formatInteger(value: number): string {
  return integerFormatter.format(value);
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return dateTimeFormatter.format(date);
}

const STATUS_LABELS: Record<string, string> = {
  created: "Criado",
  paid: "Pago",
  shipped: "Enviado",
  delivered: "Entregue",
  canceled: "Cancelado",
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  pix: "Pix",
  credit_card: "Cartao de credito",
  boleto: "Boleto",
};

export function paymentMethodLabel(method: string): string {
  return PAYMENT_METHOD_LABELS[method] ?? method;
}
