/* ==========================================================================
   Execution/ExecutionShell.js — T2.1 (PROGETTO_MOCKUP)
   Shell comune per l'esecuzione di un blocco: chrome deduplicato (top bar,
   progress bar globale con tick per blocco, sticky CTA bar bottom) intorno
   a due SLOT di contenuto (bodyHtml, ctaHtml).

   Layout mockup:
     ┌──────────────────────────────────────────┐   ← sticky top
     │ [✕]  Titolo · MM:SS · Blocco N/M   [☰]   │
     │ ──███████░░░░░░░░░░─────░───────░─────── │   ← progress + tick
     ├──────────────────────────────────────────┤
     │                                           │
     │   ${bodyHtml}  (naturale / scrollabile)   │
     │                                           │
     ├──────────────────────────────────────────┤
     │ ${ctaHtml}                                │   ← sticky bottom
     └──────────────────────────────────────────┘

   SCAFFOLD ONLY. Il body e la CTA sono passati già renderizzati dal caller
   (slot pattern). Il rendering degli esercizi per tipo (Single/Circuit/
   Tabata/EMOM/AMRAP/Pyramid) arriva in T2.2..T2.7.

   Cronometro sessione: il valore iniziale `sessionElapsedSec` viene
   formattato in MM:SS e messo in un <span id="sessionTimerText">. Il tick
   già esistente in app.js (`updateSessionTimerOnly`, 1Hz) aggiorna
   quell'elemento per id — non serve creare un timer nuovo.
   ========================================================================== */

import { esc, attr, clamp } from '../Shared/helpers.js';

function pad2(n) { return String(Math.max(0, n | 0)).padStart(2, '0'); }

/**
 * Formatta secondi → "MM:SS" (o "HH:MM:SS" oltre l'ora).
 * @param {number} sec
 * @returns {string}
 */
function formatElapsed(sec) {
  const s = Math.max(0, +sec || 0) | 0;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return h > 0 ? `${pad2(h)}:${pad2(m)}:${pad2(r)}` : `${pad2(m)}:${pad2(r)}`;
}

/**
 * Emette la shell HTML.
 *
 * @param {Object} p
 * @param {string} [p.title='Sessione']           Titolo sessione (uppercase in UI).
 * @param {number} [p.sessionElapsedSec=0]        Secondi di sessione già trascorsi.
 * @param {number} [p.blockIdx=1]                 Indice blocco corrente (1-based).
 * @param {number} [p.blockTotal=1]               Totale blocchi della sessione.
 * @param {Object} [p.progress]                   Progress bar.
 * @param {number} [p.progress.done=0]            Serie completate.
 * @param {number} [p.progress.total=0]           Serie totali.
 * @param {number} [p.progress.ticks]             Numero di tick di fine-blocco
 *                                                (default = blockTotal). Se ticks<=1
 *                                                nessun tick viene renderizzato.
 * @param {string} [p.bodyHtml='']                Slot body (già-sicuro).
 * @param {string} [p.ctaHtml='']                 Slot CTA bar (già-sicuro).
 *                                                Se vuoto la bar collassa.
 * @param {string} [p.onClose='go-home']          data-action per [✕].
 * @param {string} [p.onMenu='session-open']      data-action per [☰].
 * @param {string} [p.ariaLabel='Sessione in corso']
 * @returns {string} HTML string
 */
export function renderExecutionShell(p) {
  const opts        = p || {};
  const title       = opts.title != null ? String(opts.title) : 'Sessione';
  const elapsedSec  = Math.max(0, +opts.sessionElapsedSec || 0);
  const blockIdx    = Math.max(1, +opts.blockIdx   || 1);
  const blockTotal  = Math.max(1, +opts.blockTotal || 1);
  const progress    = opts.progress || {};
  const done        = Math.max(0, +progress.done  || 0);
  const total       = Math.max(0, +progress.total || 0);
  const ticks       = progress.ticks != null
    ? Math.max(0, +progress.ticks | 0)
    : blockTotal;
  const bodyHtml    = opts.bodyHtml || '';
  const ctaHtml     = opts.ctaHtml  || '';
  const hasCta      = String(ctaHtml).trim().length > 0;
  const closeAction = opts.onClose != null ? String(opts.onClose) : 'go-home';
  const menuAction  = opts.onMenu  != null ? String(opts.onMenu)  : 'session-open';
  const shellAria   = opts.ariaLabel || 'Sessione in corso';

  const pct         = total > 0 ? clamp((done / total) * 100, 0, 100) : 0;
  const timeText    = formatElapsed(elapsedSec);

  // Tick di fine-blocco lungo la barra: (i / N) * 100%, i = 1..(N-1).
  // Il tick di indice N cadrebbe a 100% (bordo destro): omesso.
  let ticksHtml = '';
  if (ticks >= 2) {
    let acc = '';
    for (let i = 1; i < ticks; i++) {
      const left = (i / ticks) * 100;
      acc += `<span class="ex-tick" style="left:${left.toFixed(2)}%" aria-hidden="true"></span>`;
    }
    ticksHtml = acc;
  }

  const closeBtn = `<button type="button"
      class="ex-topbar__x"
      data-action="${esc(closeAction)}"
      aria-label="Chiudi sessione">✕</button>`;

  const menuBtn = `<button type="button"
      class="ex-topbar__end"
      data-action="${esc(menuAction)}"
      aria-label="Menu sessione">☰</button>`;

  const topbar = `<div class="ex-topbar">
      ${closeBtn}
      <div class="ex-topbar__mid">
        <div class="ex-topbar__title">${esc(title)}</div>
        <div class="ex-topbar__meta">
          <span class="ex-topbar__time"
                id="sessionTimerText"
                data-session-time
                role="timer"
                aria-live="polite">${esc(timeText)}</span>
          <span class="ex-topbar__dot" aria-hidden="true"></span>
          <span class="ex-topbar__pos">Blocco ${blockIdx}/${blockTotal}</span>
        </div>
      </div>
      ${menuBtn}
    </div>`;

  const progressBar = `<div ${attr({
    class: 'ex-progress',
    role: 'progressbar',
    'aria-label': 'Progresso sessione',
    'aria-valuemin': 0,
    'aria-valuemax': total || 100,
    'aria-valuenow': done,
    'data-done': done,
    'data-total': total,
  })}>
      <div class="ex-progress__bar">
        <div class="ex-progress__fill" style="width:${pct.toFixed(2)}%"></div>
        ${ticksHtml}
      </div>
    </div>`;

  const ctaBar = `<div ${attr({
    class: 'ex-cta-bar' + (hasCta ? '' : ' ex-cta-bar--empty'),
    role: 'toolbar',
    'aria-label': 'Azioni sessione',
    'aria-hidden': hasCta ? null : 'true',
  })}>${hasCta ? ctaHtml : ''}</div>`;

  return `<div ${attr({
    class: 'ex-shell',
    'data-block-idx': blockIdx,
    'data-block-total': blockTotal,
    'aria-label': shellAria,
  })}>
    <header class="ex-shell__top" role="banner">
      ${topbar}
      ${progressBar}
    </header>
    <div class="ex-body" data-slot="body">
      ${bodyHtml}
    </div>
    ${ctaBar}
  </div>`;
}
