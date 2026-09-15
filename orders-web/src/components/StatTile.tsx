interface StatTileProps {
  label: string;
  value: string;
}

/** Stat tile simples: label + valor. Ver marks-and-anatomy.md - figuras. */
export function StatTile({ label, value }: StatTileProps) {
  return (
    <div className="card">
      <div className="stat-tile__label">{label}</div>
      <div className="stat-tile__value">{value}</div>
    </div>
  );
}
