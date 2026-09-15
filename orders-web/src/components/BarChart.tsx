import { useState } from "react";
import { niceTicks, roundedTopRectPath } from "../utils/chart";

export interface BarChartDatum {
  label: string;
  value: number;
}

interface BarChartProps {
  data: BarChartDatum[];
  /** Titulo acessivel do grafico (lido por leitor de tela, nao renderizado). */
  ariaLabel: string;
  color?: string;
  formatValue?: (value: number) => string;
  formatTick?: (value: number) => string;
}

const WIDTH = 600;
const HEIGHT = 260;
const MARGIN = { top: 30, right: 12, bottom: 30, left: 46 };
const MAX_BAR_WIDTH = 24;

/**
 * Bar chart em SVG puro, seguindo o guia de dataviz do projeto: barra fina
 * (<=24px) com topo arredondado (4px) e base reta, gridlines em hairline
 * recessivo, rotulo direto no topo de cada barra e tooltip on hover/focus.
 */
export function BarChart({ data, ariaLabel, color = "var(--series-1)", formatValue, formatTick }: BarChartProps) {
  const [hover, setHover] = useState<{ index: number; x: number; y: number } | null>(null);

  const fmtValue = formatValue ?? ((v: number) => String(v));
  const fmtTick = formatTick ?? fmtValue;

  const plotWidth = WIDTH - MARGIN.left - MARGIN.right;
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

  const maxValue = Math.max(...data.map((d) => d.value), 0);
  const ticks = niceTicks(maxValue, 4);
  const niceMax = ticks[ticks.length - 1] ?? 1;

  const bandWidth = data.length > 0 ? plotWidth / data.length : plotWidth;
  const barWidth = Math.max(Math.min(MAX_BAR_WIDTH, bandWidth * 0.55), 4);

  const yFor = (value: number) => MARGIN.top + plotHeight - (value / niceMax) * plotHeight;
  const baselineY = MARGIN.top + plotHeight;

  return (
    <div style={{ position: "relative" }}>
      <svg
        className="bar-chart"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width="100%"
        height={HEIGHT}
        role="img"
        aria-label={ariaLabel}
      >
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              className={tick === 0 ? "bar-chart__baseline" : "bar-chart__gridline"}
              x1={MARGIN.left}
              x2={WIDTH - MARGIN.right}
              y1={yFor(tick)}
              y2={yFor(tick)}
            />
            <text x={MARGIN.left - 8} y={yFor(tick)} dy="0.32em" fontSize={10} textAnchor="end">
              {fmtTick(tick)}
            </text>
          </g>
        ))}

        {data.map((d, i) => {
          const bandX = MARGIN.left + i * bandWidth;
          const barX = bandX + (bandWidth - barWidth) / 2;
          const barY = yFor(d.value);
          const barHeight = baselineY - barY;

          return (
            <g
              key={d.label}
              className="bar-chart__group"
              tabIndex={0}
              role="button"
              aria-label={`${d.label}: ${fmtValue(d.value)}`}
              onMouseMove={(e) => setHover({ index: i, x: e.clientX, y: e.clientY })}
              onMouseLeave={() => setHover(null)}
              onFocus={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setHover({ index: i, x: rect.left + rect.width / 2, y: rect.top });
              }}
              onBlur={() => setHover(null)}
              style={{ outline: "none", cursor: "default" }}
            >
              {/* Hit target maior que a barra (banda inteira), conforme guia de interacao. */}
              <rect x={bandX} y={MARGIN.top} width={bandWidth} height={plotHeight} fill="transparent" />
              <path className="bar-chart__bar" d={roundedTopRectPath(barX, barY, barWidth, barHeight, 4)} fill={color} />
              <text x={bandX + bandWidth / 2} y={barY - 8} textAnchor="middle" fontSize={11} className="bar-chart__value-label">
                {fmtValue(d.value)}
              </text>
              <text x={bandX + bandWidth / 2} y={baselineY + 16} textAnchor="middle" fontSize={11}>
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>

      {hover && data[hover.index] && (
        <div className="chart-tooltip" style={{ left: hover.x, top: hover.y - 10 }}>
          {data[hover.index]!.label}: <strong>{fmtValue(data[hover.index]!.value)}</strong>
        </div>
      )}
    </div>
  );
}
