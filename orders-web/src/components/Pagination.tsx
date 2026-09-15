interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, totalItems, onPageChange }: PaginationProps) {
  const safeTotalPages = Math.max(totalPages, 1);

  return (
    <div className="pagination">
      <button type="button" className="btn" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        Anterior
      </button>
      <span>
        Pagina {page} de {safeTotalPages} · {totalItems} pedido{totalItems === 1 ? "" : "s"}
      </span>
      <button
        type="button"
        className="btn"
        disabled={page >= safeTotalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Proxima
      </button>
    </div>
  );
}
