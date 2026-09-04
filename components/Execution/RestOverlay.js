/* ==========================================================================
   Execution/RestOverlay.js — T2.4 (2026-08-24) · PROGETTO_MOCKUP
   Overlay countdown full-screen per la fase di RECUPERO. Sostituisce la
   render legacy `RestScene` (rest-v2) per l'esperienza pixel del mockup D
   di Desktop/fit-tracker-workout-execution-mockup.html.

   Contract IO (identico chiamante):
     · legge lo stato dal chiamante (app.js `restOverlayHtml()`) — nessuna
       query IndexedDB, nessuna dipendenza dal timer engine.
     · `startRestTimer(sec, label)` non modificato: leggiamo `S.timer`
       (startedAt, end, totalSec, label, paused, remainingMs).
     · attions delegate: `stop-rest` (Skip / ✕), `add-rest-15`, `add-rest-30`,
       `sub-rest-15`, `sub-rest-30`. L'auto-close a 0s + beep opzionale
       (`S.prefs.sounds`) resta in `updateRestTimerOnly` di app.js.

   Palette bianco + accent giallo:
     · countdown normale = gradient bianco → grigio (leggibile su nero)
     · countdown urgente (leftSec <= urgencyThresholdSec, default 15) =
       gradient giallo → arancione (--color-accent-2 → --color-warning),
       gradient SENZA hue viola in nessun stop
     · track fill = --color-accent (giallo)

   ExerciseIdentity size='sm' per la card `.ex-rest-nx` (mai <img> diretto).

   Reduced-motion: nessun pulse sul countdown quando prefers-reduced-motion.
   Focus-visible: outline 2px giallo su ±15/±30/Skip/✕.
   ========================================================================== */

import { esc, attr } from '../Shared/helpers.js';
import { ExerciseIdentity } from '../Exercise/ExerciseIdentity.js';

function fmtMmSs(sec) {
  const s = Math.max(0, Math.floor(+sec || 0));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return String(mm).padStart(2, '0') + ':' + String(ss).padStart(2, '0');
}

function progressPct(leftSec, totalSec) {
  const t = Math.max(1, +totalSec || 60);
  const l = Math.max(0, Math.min(t, +leftSec || 0));
  return Math.round(((t - l) / t) * 100);
}

/**
 * @param {Object} opts
 * @param {number} opts.leftSec                  secondi rimanenti (Math.ceil già applicato)
 * @param {number} opts.totalSec                 secondi totali del rest
 * @param {boolean} [opts.paused]
 * @param {number}  [opts.urgencyThresholdSec=15]  sotto → gradient urgenza
 * @param {string}  [opts.headerLabel='Recupero']  label header
 * @param {Object}  [opts.next]
 *   @param {string} [opts.next.name]            nome canonico esercizio (per ExerciseIdentity)
 *   @param {string} [opts.next.title]           es. "Panca piana · Set 4"
 *   @param {string} [opts.next.eyebrow]         es. "Prossimo"
 *   @param {string} [opts.next.targetReps]      es. "8-10"
 *   @param {number|null} [opts.next.targetKg]   es. 62
 *   @param {string} [opts.next.note]            es. "ultimo blocco"
 *   @param {string} [opts.next.fallbackMessage] mostrato se next==null
 * @param {Object}  [opts.stats]
 *   @param {number} [opts.stats.prCount=0]          "+N" giallo (assente → nessuna cell)
 *   @param {number|null} [opts.stats.lastSetKg]     kg dell'ultimo set completato
 *   @param {string|null} [opts.stats.lastSetReps]   reps dell'ultimo set completato
 *   @param {string} [opts.stats.progressValue]     es. "3" (Set N di M) o "2" (Giro N di M)
 *   @param {string} [opts.stats.progressTotal]     es. "4"
 *   @param {string} [opts.stats.progressLabel]     es. "Set" o "Giro"
 */
export function renderRestOverlay(opts = {}) {
  const leftSec  = Math.max(0, +opts.leftSec  || 0);
  const totalSec = Math.max(1, +opts.totalSec || 60);
  const paused   = !!opts.paused;
  const urgencyThreshold = Math.max(0, +opts.urgencyThresholdSec || 15);
  const urgent   = leftSec > 0 && leftSec <= urgencyThreshold;
  const headerLabel = String(opts.headerLabel || 'Recupero');
  const pct      = progressPct(leftSec, totalSec);

  const next = opts.next || null;
  const stats = opts.stats || {};

  /* header --------------------------------------------------------------- */
  const headerHtml = `
    <div class="ex-rest-hd">
      <div class="ex-rest-lbl" role="status" aria-live="polite">
        <span class="ex-rest-lbl__dot" aria-hidden="true"></span>${esc(headerLabel)}
      </div>
      <button type="button"
              class="ex-rest-close"
              data-action="stop-rest"
              aria-label="Chiudi recupero">✕</button>
    </div>`;

  /* countdown ------------------------------------------------------------ */
  const numAttrs = attr({
    class: 'ex-rest-num',
    'data-urgent': urgent ? '1' : '0',
    'data-paused': paused ? '1' : '0',
  });
  const numHtml = `
    <div ${numAttrs}>
      <div class="ex-rest-num__v"
           role="timer"
           aria-live="off"
           aria-label="Countdown ${fmtMmSs(leftSec)}">${esc(fmtMmSs(leftSec))}</div>
      <div class="ex-rest-num__u" aria-hidden="true">mm:ss</div>
    </div>`;

  const trackHtml = `
    <div class="ex-rest-track" role="progressbar"
         aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"
         aria-label="Avanzamento recupero">
      <div class="ex-rest-track__f" style="width:${pct}%"></div>
    </div>`;

  /* shortcut ±15/±30 ----------------------------------------------------- */
  const adjHtml = `
    <div class="ex-rest-adj" role="group" aria-label="Regola durata recupero">
      <button type="button" class="ex-rest-adj__b ex-rest-adj__b--minus"
              data-action="sub-rest-30" aria-label="Sottrai 30 secondi">−30″</button>
      <button type="button" class="ex-rest-adj__b ex-rest-adj__b--minus"
              data-action="sub-rest-15" aria-label="Sottrai 15 secondi">−15″</button>
      <button type="button" class="ex-rest-adj__b"
              data-action="add-rest-15" aria-label="Aggiungi 15 secondi">+15″</button>
      <button type="button" class="ex-rest-adj__b"
              data-action="add-rest-30" aria-label="Aggiungi 30 secondi">+30″</button>
    </div>`;

  /* stats --------------------------------------------------------------- */
  const prCount = Math.max(0, +stats.prCount || 0);
  const lastSetKg = stats.lastSetKg;
  const lastSetReps = stats.lastSetReps;
  const hasLast = (lastSetKg != null && lastSetKg !== '') ||
                  (lastSetReps != null && lastSetReps !== '');
  const progressValue = stats.progressValue;
  const progressTotal = stats.progressTotal;
  const progressLabel = stats.progressLabel || 'Avanzamento';
  const hasProgress = progressValue != null && progressTotal != null;

  const statCells = [];
  if (prCount > 0) {
    statCells.push(`
      <div class="ex-rest-stat">
        <div class="ex-rest-stat__v ex-rest-stat__v--pr">+${prCount}</div>
        <div class="ex-rest-stat__l">${prCount === 1 ? 'PR appena preso' : 'PR appena presi'}</div>
      </div>`);
  }
  if (hasLast) {
    const kgStr = (lastSetKg != null && lastSetKg !== '') ? String(lastSetKg) : '';
    const repsStr = (lastSetReps != null && lastSetReps !== '') ? String(lastSetReps) : '';
    let valInner;
    if (kgStr && repsStr) {
      valInner = `${esc(kgStr)}<span class="ex-rest-stat__u">kg × ${esc(repsStr)}</span>`;
    } else if (kgStr) {
      valInner = `${esc(kgStr)}<span class="ex-rest-stat__u">kg</span>`;
    } else {
      valInner = `${esc(repsStr)}<span class="ex-rest-stat__u">reps</span>`;
    }
    statCells.push(`
      <div class="ex-rest-stat">
        <div class="ex-rest-stat__v">${valInner}</div>
        <div class="ex-rest-stat__l">Ultimo set</div>
      </div>`);
  }
  if (hasProgress) {
    statCells.push(`
      <div class="ex-rest-stat">
        <div class="ex-rest-stat__v">${esc(String(progressValue))}<span class="ex-rest-stat__u">/${esc(String(progressTotal))}</span></div>
        <div class="ex-rest-stat__l">${esc(String(progressLabel))}</div>
      </div>`);
  }
  const statsHtml = statCells.length
    ? `<div class="ex-rest-stats">${statCells.join('')}</div>`
    : '';

  /* next-up card -------------------------------------------------------- */
  let nextHtml = '';
  if (next && (next.name || next.title)) {
    const identityHtml = next.name
      ? ExerciseIdentity({
          name: String(next.name),
          size: 'sm',
          status: 'upcoming',
        })
      : '';
    const targetBits = [];
    if (next.targetReps) targetBits.push(`<span><b>${esc(String(next.targetReps))}</b> reps</span>`);
    if (next.targetKg != null && next.targetKg !== '') targetBits.push(`<span><b>${esc(String(next.targetKg))}</b> kg</span>`);
    if (next.note) targetBits.push(`<span>${esc(String(next.note))}</span>`);
    const metaHtml = targetBits.length
      ? `<div class="ex-rest-nx__meta">${targetBits.join('<span class="ex-rest-nx__sep">·</span>')}</div>`
      : '';
    const displayName = next.title || next.name || '';
    const eyebrow = next.eyebrow || 'Prossimo';
    nextHtml = `
      <div class="ex-rest-nx">
        <div class="ex-rest-nx__lbl">${esc(String(eyebrow))}</div>
        <div class="ex-rest-nx__row">
          <div class="ex-rest-nx__identity">${identityHtml}</div>
          <div class="ex-rest-nx__info">
            <p class="ex-rest-nx__name">${esc(String(displayName))}</p>
            ${metaHtml}
          </div>
        </div>
      </div>`;
  } else if (opts.next && opts.next.fallbackMessage) {
    nextHtml = `
      <div class="ex-rest-nx ex-rest-nx--end">
        <div class="ex-rest-nx__lbl">Fine sessione</div>
        <p class="ex-rest-nx__name">${esc(String(opts.next.fallbackMessage))}</p>
      </div>`;
  }

  /* skip CTA ------------------------------------------------------------ */
  const ctaHtml = `
    <div class="ex-rest-cta">
      <button type="button" class="ex-rest-cta__b"
              data-action="stop-rest" aria-label="Salta recupero">
        Salta recupero
      </button>
    </div>`;

  const rootAttrs = attr({
    class: 'ex-rest-overlay',
    role: 'dialog',
    'aria-modal': 'true',
    'aria-label': 'Recupero in corso',
    'data-urgent': urgent ? '1' : '0',
    'data-paused': paused ? '1' : '0',
  });

  return `<div ${rootAttrs}>
    ${headerHtml}
    ${numHtml}
    ${trackHtml}
    ${adjHtml}
    ${statsHtml}
    ${nextHtml}
    ${ctaHtml}
  </div>`;
}
