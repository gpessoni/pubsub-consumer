export function LoadingBox({ label = "Carregando..." }: { label?: string }) {
  return <div className="state-box">{label}</div>;
}

export function ErrorBox({ message }: { message: string }) {
  return <div className="state-box state-box--error">Erro: {message}</div>;
}

export function EmptyBox({ label = "Nenhum resultado encontrado." }: { label?: string }) {
  return <div className="state-box">{label}</div>;
}
