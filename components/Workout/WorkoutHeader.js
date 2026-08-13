/* ==========================================================================
   Workout/WorkoutHeader.js — Hotfix collapsible sticky header
   Header della Workout Screen con due stati:

     data-collapsed="0" (expanded, default all'apertura)
     ┌────────────────────────────────────────────────┐
     │  ←        Round X di Y                    ⋮    │  ← topbar
     │                                                 │
     │  Mercoledì                                      │  ← body: titolo XL
     │  Settimana A · Gambe + Spalle                   │  ← subtitle
     │  [badge] [Vista completa] [INIZIO]              │  ← actions
     ├─────────────────────────────────────────────────┤
     │·············································    │  ← progress strip (soft)
     └────────────────────────────────────────────────┘

     data-collapsed="1" (collapsed, dopo scroll > threshold)
     ┌────────────────────────────────────────────────┐
     │  ←  Mercoledì   [Vista] [INIZIO]           ⋮    │  ← toolbar 56–60px
     ├─────────────────────────────────────────────────┤
     │███████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░    │  ← 3px sticky bar
     └────────────────────────────────────────────────┘

   Le azioni sono emesse tramite data-action (delegator globale). Perché
   duplichiamo viewBtn/startBtn nella toolbar? Perché la toolbar è un
   contenitore differente dal body, animare il riposizionamento reale
   causerebbe jank; render statico + display toggle è più fluido.
   ========================================================================== */

import { esc, attr, clamp } from '../Shared/helpers.js';
import { icon as renderIcon } from '../Shared/Icon.js';

/**
 * @param {Object} opts
 * @param {string} [opts.title='Workout']
 * @param {string} [opts.subtitle]      Testo, viene escapato.
 * @param {string} [opts.subtitleHtml]  HTML già-sicuro (precede subtitle).
 * @param {string} [opts.eyebrow]
 * @param {number} [opts.round]
 * @param {number} [opts.roundTotal]
 * @param {string} [opts.roundLabel='Round']
 * @param {string} [opts.backAction='go-home']
 * @param {string} [opts.settingsAction='session-open']
 * @param {string} [opts.actions]          HTML slot per il body espanso (badge + Vista + Inizia).
 * @param {string} [opts.toolbarActions]   HTML compatto per la toolbar collassata (Vista + Inizia).
 * @param {string} [opts.actionsExtra]     HTML extra (badge sessione custom, ecc.).
 * @param {number} [opts.progress]         0-100, percentuale sessione — alimenta la strip.
 */
export function WorkoutHeader(opts = {}) {
  const title    = opts.title    || 'Workout';
  const subtitle = opts.subtitle || '';
  const eyebrow  = opts.eyebrow  || '';
  const roundLabel = opts.roundLabel || 'Round';
  const pct = clamp(Number(opts.progress) || 0, 0, 100);

  const backHtml = opts.backAction !== ''
    ? `<button type="button"
                class="c-workoutHeader__iconBtn c-workoutHeader__iconBtn--back"
                data-action="${esc(opts.backAction || 'go-home')}"
                aria-label="Indietro">
          ${renderIcon('arrow', 'medium')}
       </button>`
    : '<span class="c-workoutHeader__iconSlot" aria-hidden="true"></span>';

  const settingsHtml = opts.settingsAction !== ''
    ? `<button type="button"
                class="c-workoutHeader__iconBtn c-workoutHeader__iconBtn--menu"
                data-action="${esc(opts.settingsAction || 'session-open')}"
                aria-label="Menu sessione">
          <span aria-hidden="true">⋮</span>
       </button>`
    : '<span class="c-workoutHeader__iconSlot" aria-hidden="true"></span>';

  const roundHtml = (opts.round != null && opts.roundTotal != null)
    ? `<div class="c-workoutHeader__round" role="status" aria-live="polite">
         <span class="c-workoutHeader__roundLabel">${esc(roundLabel)}</span>
         <span class="c-workoutHeader__roundValue">${esc(opts.round)}</span>
         <span class="c-workoutHeader__roundSep">di</span>
         <span class="c-workoutHeader__roundTotal">${esc(opts.roundTotal)}</span>
       </div>`
    : (eyebrow
      ? `<div class="c-workoutHeader__round c-workoutHeader__round--text">${esc(eyebrow)}</div>`
      : '');

  const subtitleInner = opts.subtitleHtml
    ? String(opts.subtitleHtml)
    : (subtitle ? esc(subtitle) : '');
  const subtitleHtml = subtitleInner
    ? `<p class="c-workoutHeader__subtitle">${subtitleInner}</p>`
    : '';

  const bodyActions = opts.actions
    ? `<div class="c-workoutHeader__actions">${opts.actions}</div>`
    : '';

  const extraHtml = opts.actionsExtra
    ? `<div class="c-workoutHeader__extra">${opts.actionsExtra}</div>`
    : '';

  const toolbarActionsHtml = opts.toolbarActions
    ? `<div class="c-workoutHeader__toolbarActions c-workoutHeader__slot--collapsed">${opts.toolbarActions}</div>`
    : '';

  const toolbarTitleHtml = `<h2 class="c-workoutHeader__toolbarTitle c-workoutHeader__slot--collapsed">${esc(title)}</h2>`;

  const expandedCenter = roundHtml
    ? `<div class="c-workoutHeader__slot--expanded">${roundHtml}</div>`
    : '';

  return `<header ${attr({
    class: 'c-workoutHeader',
    'aria-label': 'Header sessione',
    'data-collapsed': '0',
    'data-progress': String(Math.round(pct)),
  })}>
    <div class="c-workoutHeader__topbar">
      ${backHtml}
      <div class="c-workoutHeader__topbarCenter">
        ${expandedCenter}
        ${toolbarTitleHtml}
      </div>
      ${toolbarActionsHtml}
      ${settingsHtml}
    </div>
    <div class="c-workoutHeader__body c-workoutHeader__slot--expanded">
      <h1 class="c-workoutHeader__title">${esc(title)}</h1>
      ${subtitleHtml}
      ${bodyActions}
      ${extraHtml}
    </div>
    <span class="c-workoutHeader__progressStrip" aria-hidden="true">
      <i style="width:${pct.toFixed(2)}%"></i>
    </span>
  </header>`;
}

/**
 * Aggiorna in-place la strip di progresso senza rimontare il header.
 * @param {HTMLElement} rootEl  il <header class="c-workoutHeader">
 * @param {number} pct          0-100
 */
export function setWorkoutHeaderProgress(rootEl, pct) {
  if (!rootEl) return;
  const p = clamp(Number(pct) || 0, 0, 100);
  rootEl.dataset.progress = String(Math.round(p));
  const fill = rootEl.querySelector('.c-workoutHeader__progressStrip > i');
  if (fill) fill.style.width = p.toFixed(2) + '%';
}
