/* ==========================================================================
   Charts/LineChart.js
   Line chart SVG puro. Riceve serie di dati numerici. Dot su ogni punto.
   ========================================================================== */

import { esc } from '../Shared/helpers.js';

/**
 * @param {Object} [opts]
 * @param {number[]} [opts.data]
 * @param {string} [opts.title='Andamento']
 * @param {number} [opts.width=320]
 * @param {number} [opts.height=120]
 * @param {number} [opts.padding=12]
 * @param {boolean} [opts.showDots=true]
 * @param {string} [opts.ariaLabel]
 */
export function LineChart(opts = {}) {
  const data = opts.data || [3, 5, 4, 7, 6, 8, 9];
  const w = opts.width  || 320;
  const h = opts.height || 120;
  const pad = opts.padding != null ? opts.padding : 12;
  const showDots = opts.showDots !== false;

  const max = Math.max.apply(null, data);
  const min = Math.min.apply(null, data);
  const span = Math.max(1, max - min);
  const xs = data.length > 1 ? (w - pad * 2) / (data.length - 1) : 0;
  const pts = data.map((v, i) => {
    const x = pad + i * xs;
    const y = h - pad - ((v - min) / span) * (h - pad * 2);
    return [x.toFixed(1), y.toFixed(1)];
  });
  const polyline = pts.map(([x, y]) => `${x},${y}`).join(' ');
  const dots = showDots
    ? pts.map(([x, y]) => `<circle class="c-chart__dot" cx="${x}" cy="${y}" r="3"/>`).join('')
    : '';

  return `<div class="c-chart">
    <h4 class="c-chart__title">${esc(opts.title || 'Andamento')}</h4>
    <svg class="c-chart__svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(opts.ariaLabel || opts.title || 'Line chart')}">
      <polyline class="c-chart__line" points="${polyline}"/>
      ${dots}
    </svg>
  </div>`;
}
