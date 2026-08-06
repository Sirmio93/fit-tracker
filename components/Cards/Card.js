/* ==========================================================================
   Cards/Card.js
   Card base. Le varianti sono file distinti (HeroCard, WorkoutCard, ...) che
   invocano `Card({variant})` con lo slot `extra` per il contenuto specifico.
   ========================================================================== */

import { esc, cx, attr } from '../Shared/helpers.js';

/**
 * @param {Object} [opts]
 * @param {string} [opts.variant] — 'hero'|'workout'|'statistic'|'history'|'record'|'goal'|'empty'|'loading'|'exercise'|undefined
 * @param {string} [opts.eyebrow]
 * @param {string} [opts.title]
 * @param {string} [opts.body]
 * @param {string} [opts.footer] — HTML string (es. Button).
 * @param {string} [opts.extra]  — HTML string aggiuntivo dopo body.
 * @param {boolean} [opts.interactive] — aggiunge tabindex/role button e stato :hover/:active.
 * @param {string} [opts.ariaLabel]
 * @param {Object} [opts.dataset]
 */
export function Card(opts = {}) {
  const cls = cx([
    'c-card',
    opts.variant ? `c-card--${opts.variant}` : '',
    opts.interactive ? 'is-interactive' : '',
  ]);

  const eyebrow = opts.eyebrow ? `<div class="c-card__eyebrow">${esc(opts.eyebrow)}</div>` : '';
  const title   = opts.title   ? `<h3 class="c-card__title">${esc(opts.title)}</h3>` : '';
  const body    = opts.body    ? `<p class="c-card__body">${esc(opts.body)}</p>`     : '';
  const footer  = opts.footer  ? `<div class="c-card__row">${opts.footer}</div>`     : '';
  const extra   = opts.extra   || '';

  const attrs = {
    class: cls,
    tabindex: opts.interactive ? '0' : null,
    role: opts.interactive ? 'button' : null,
    'aria-label': opts.ariaLabel || null,
  };
  if (opts.dataset) {
    for (const k of Object.keys(opts.dataset)) attrs[`data-${k}`] = opts.dataset[k];
  }

  return `<article ${attr(attrs)}>${eyebrow}${title}${body}${extra}${footer}</article>`;
}
