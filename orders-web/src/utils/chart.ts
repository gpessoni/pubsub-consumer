/** Arredonda `range` para um numero "bonito" (1/2/5 * 10^n), estilo d3.ticks. */
function niceNum(range: number, round: boolean): number {
  if (range <= 0) return 1;
  const exponent = Math.floor(Math.log10(range));
  const fraction = range / 10 ** exponent;
  let niceFraction: number;

  if (round) {
    if (fraction < 1.5) niceFraction = 1;
    else if (fraction < 3) niceFraction = 2;
    else if (fraction < 7) niceFraction = 5;
    else niceFraction = 10;
  } else {
    if (fraction <= 1) niceFraction = 1;
    else if (fraction <= 2) niceFraction = 2;
    else if (fraction <= 5) niceFraction = 5;
    else niceFraction = 10;
  }

  return niceFraction * 10 ** exponent;
}

/** Ticks de eixo Y "bonitos" (0, ..., >= max), para gridlines legiveis. */
export function niceTicks(max: number, tickCount = 4): number[] {
  if (!Number.isFinite(max) || max <= 0) return [0, 1];

  const range = niceNum(max, false);
  const step = niceNum(range / Math.max(tickCount - 1, 1), true);
  const niceMax = Math.ceil(max / step) * step;

  const ticks: number[] = [];
  for (let v = 0; v <= niceMax + step / 2; v += step) {
    ticks.push(Math.round(v * 100) / 100);
  }
  return ticks;
}

/** Path de um retangulo com cantos arredondados apenas no topo (data-end), reto na base. */
export function roundedTopRectPath(x: number, y: number, width: number, height: number, radius: number): string {
  const r = Math.min(radius, width / 2, Math.max(height, 0));
  if (height <= 0) return "";
  if (r <= 0) {
    return `M${x},${y} h${width} v${height} h${-width} Z`;
  }
  return [
    `M${x},${y + r}`,
    `a${r},${r} 0 0 1 ${r},${-r}`,
    `h${width - 2 * r}`,
    `a${r},${r} 0 0 1 ${r},${r}`,
    `v${height - r}`,
    `h${-width}`,
    `Z`,
  ].join(" ");
}
