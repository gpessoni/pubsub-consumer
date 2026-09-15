import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="state-box">
      <p>Pagina nao encontrada.</p>
      <Link to="/">Voltar para o dashboard</Link>
    </div>
  );
}
