/* ==========================================================================
   Charts/BarChart.js
   Bar chart verticale. Barre uniformi, label sull'asse X.
   ========================================================================== */

import { esc } from '../Shared/helpers.js';

/**
 * @param {Object} [opts]
 * @param {number[]} [opts.data]
 * @param {string[]} [opts.labels]
 * @param {string} [opts.title='Volume per giorno']
 * @param {number} [opts.width=320]
 * @param {number} [opts.height=120]
 * @param {number} [opts.padding=12]
 * @param {string} [opts.ariaLabel]
 */
export function BarChart(opts = {}) {
  const data   = opts.data   || [4, 6, 3, 7, 5, 8, 2];
  const labels = opts.labels || ['L', 'M', 'M', 'G', 'V', 'S', 'D'];
  const w = opts.width  || 320;
  const h = opts.height || 120;
  const pad = opts.padding != null ? opts.padding : 12;
  const max = Math.max.apply(null, data);
  const gap = 4;
  const bw = (w - pad * 2 - gap * (data.length - 1)) / data.length;

  const bars = data.map((v, i) => {
    const bh = (v / Math.max(1, max)) * (h - pad * 2 - 12);
    const x = pad + i * (bw + gap);
    const y = h - pad - 12 - bh;
    return (
      `<rect class="c-chart__bar" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" rx="3"/>` +
      `<text class="c-chart__label" x="${(x + bw / 2).toFixed(1)}" y="${(h - 2)}" text-anchor="middle">${esc(labels[i] || '')}</text>`
    );
  }).join('');

  return `<div class="c-chart">
    <h4 class="c-chart__title">${esc(opts.title || 'Volume per giorno')}</h4>
    <svg class="c-chart__svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(opts.ariaLabel || opts.title || 'Bar chart')}">${bars}</svg>
  </div>`;
}
