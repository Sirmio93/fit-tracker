/* ==========================================================================
   Charts/AreaChart.js
   Area chart: linea + area riempita fino all'asse X.
   ========================================================================== */

import { esc } from '../Shared/helpers.js';

/**
 * @param {Object} [opts]
 * @param {number[]} [opts.data]
 * @param {string} [opts.title='Volume cumulato']
 * @param {number} [opts.width=320]
 * @param {number} [opts.height=120]
 * @param {number} [opts.padding=12]
 * @param {string} [opts.ariaLabel]
 */
export function AreaChart(opts = {}) {
  const data = opts.data || [3, 5, 4, 7, 6, 8, 9];
  const w = opts.width  || 320;
  const h = opts.height || 120;
  const pad = opts.padding != null ? opts.padding : 12;

  const max = Math.max.apply(null, data);
  const min = 0;
  const xs = (w - pad * 2) / Math.max(1, data.length - 1);
  const pts = data.map((v, i) => {
    const x = pad + i * xs;
    const y = h - pad - ((v - min) / Math.max(1, max - min)) * (h - pad * 2);
    return [x.toFixed(1), y.toFixed(1)];
  });
  const polyline = pts.map(([x, y]) => `${x},${y}`).join(' ');
  const polygon  = `${polyline} ${(w - pad).toFixed(1)},${(h - pad).toFixed(1)} ${pad},${(h - pad).toFixed(1)}`;

  return `<div class="c-chart c-chart--area">
    <h4 class="c-chart__title">${esc(opts.title || 'Volume cumulato')}</h4>
    <svg class="c-chart__svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(opts.ariaLabel || opts.title || 'Area chart')}">
      <polygon class="c-chart__area" points="${polygon}"/>
      <polyline class="c-chart__line" points="${polyline}"/>
    </svg>
  </div>`;
}
