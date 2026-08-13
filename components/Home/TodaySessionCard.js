/* ==========================================================================
   Home/TodaySessionCard.js
   Hero card "OGGI" del mockup: titolo scheda del giorno + ring % Completato
   + 3 KPI (Durata / Esercizi / Volume) + CTA full-width.
   Sprint 9 — pixel-accurate mockup Home.
   ========================================================================== */

import { esc, cx, clamp } from '../Shared/helpers.js';
import { icon } from '../Shared/Icon.js';
import { Ring } from '../Foundation/Ring.js';

/**
 * @param {Object} opts
 * @param {string} [opts.eyebrow='OGGI']
 * @param {string} opts.title                 — es. 'Petto + Dorso'.
 * @param {number} [opts.progress=0]          — 0-100.
 * @param {string} [opts.progressLabel='Completato']
 * @param {Array<{label:string,value:string}>} [opts.stats] — max 3.
 * @param {Object} [opts.cta]                 — { text, icon?, action?, dataset? }.
 * @param {boolean} [opts.compact=false]      — versione senza KPI (empty state).
 */
export function TodaySessionCard(opts = {}) {
  const eyebrow = opts.eyebrow || 'OGGI';
  const title = opts.title || 'Nessuna sessione';
  const pct = clamp(opts.progress != null ? opts.progress : 0, 0, 100);
  const progressLabel = opts.progressLabel || 'Completato';
  const stats = Array.isArray(opts.stats) ? opts.stats.slice(0, 3) : [];

  // Sprint 9.2B — ring delegato a Foundation/Ring. Il centro contiene la
  // percentuale con simbolo separato + la label (Completato). Manteniamo
  // .c-todayCard__ring come wrapper esterno per gli hook di layout della
  // hero card, mentre il centro custom (ringInfo) resta identico.
  const centerHtml = `<div class="c-todayCard__ringInfo">
      <span class="c-todayCard__ringPct">${pct}<small>%</small></span>
      <span class="c-todayCard__ringLabel">${esc(progressLabel)}</span>
    </div>`;

  const ringInner = Ring({
    value: pct,
    max: 100,
    size: 96,
    stroke: 8,
    color: 'primary',
    background: 'subtle',
    animated: true,
    centerHtml,
    ariaLabel: `${pct} percento completato`,
  });

  const ringHtml = `<div class="c-todayCard__ring">${ringInner}</div>`;

  const statsHtml = stats.length
    ? `<div class="c-todayCard__stats">${
        stats.map(function (s) {
          return `<div class="c-todayCard__stat">
            <span class="c-todayCard__statLabel">${esc(s.label || '')}</span>
            <span class="c-todayCard__statValue">${esc(s.value != null ? s.value : '—')}</span>
          </div>`;
        }).join('<span class="c-todayCard__statSep" aria-hidden="true"></span>')
      }</div>`
    : '';

  let ctaHtml = '';
  if (opts.cta) {
    const cta = opts.cta;
    const dataAttrs = [];
    if (cta.action) dataAttrs.push(`data-action="${esc(cta.action)}"`);
    if (cta.dataset) {
      for (const k of Object.keys(cta.dataset)) dataAttrs.push(`data-${esc(k)}="${esc(cta.dataset[k])}"`);
    }
    const iconHtml = cta.icon ? `<span class="c-todayCard__ctaIcon" aria-hidden="true">${icon(cta.icon, 'small')}</span>` : '';
    ctaHtml = `<button type="button" class="c-todayCard__cta" ${dataAttrs.join(' ')}>${iconHtml}<span class="c-todayCard__ctaText">${esc(cta.text || 'AVVIA')}</span></button>`;
  }

  const cls = cx(['c-todayCard', opts.compact ? 'c-todayCard--compact' : '']);

  return `<article class="${cls}" aria-label="${esc(title)}">
    <div class="c-todayCard__head">
      <div class="c-todayCard__headText">
        <span class="c-todayCard__eyebrow">${esc(eyebrow)}</span>
        <h2 class="c-todayCard__title">${esc(title)}</h2>
      </div>
      ${ringHtml}
    </div>
    ${statsHtml}
    ${ctaHtml}
  </article>`;
}
