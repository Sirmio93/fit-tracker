/* ==========================================================================
   Feedback/Skeleton.js
   Placeholder shimmer generico da usare quando serve
   uno skeleton non-card (linee libere per lista/testo).
   ========================================================================== */

/**
 * @param {Object} [opts]
 * @param {number} [opts.lines=3]
 * @param {number[]} [opts.widths] — width in % per ogni riga; default alternato.
 * @param {string}  [opts.ariaLabel='Caricamento']
 */
export function Skeleton(opts = {}) {
  const n = Math.max(1, Math.min(10, opts.lines != null ? opts.lines : 3));
  const widths = opts.widths && opts.widths.length ? opts.widths : [100, 80, 60, 90, 70];
  let inner = '';
  for (let i = 0; i < n; i++) {
    inner += `<div class="c-skeleton c-skeleton--line" style="width:${widths[i % widths.length]}%"></div>`;
  }
  return `<div class="c-skeletonBlock" role="status" aria-busy="true" aria-label="${opts.ariaLabel || 'Caricamento'}">${inner}</div>`;
}
