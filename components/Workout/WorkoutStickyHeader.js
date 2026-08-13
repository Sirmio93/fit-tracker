/* ==========================================================================
   Workout/WorkoutStickyHeader.js — Sprint 9.1A (Unified Session Header)
   L'UNICO componente Header per la schermata Workout. Modalità supportate:

     · sticky (default) — morphing continuo expanded ↔ compact durante lo
       scroll. Expanded ≈ 220-250px, compact ≈ 56-60px, hairline sempre in DOM.
     · immersive         — variante piatta usata dalla scena focus-single
       (`.c-workoutSceneV2`): niente sticky, niente background/blur, niente
       body né hairline; solo topbar con "Serie X di Y" testuale e segments.
       Sostituisce definitivamente il vecchio `WorkoutTopBar`.

   Contratto sticky:
     JS scrive `--collapse` (0..1) sul root; il CSS interpola in continuo
     opacity / scale / translate / max-height / padding con calc(). Nessun
     `display:none` sugli elementi principali — sempre in DOM per non
     spezzare il focus. `data-collapsed` (soglia 0.55) governa solo
     pointer-events e aria-hidden.

   Info compatte (Sprint 9.1A #3):
     In compact NON viene mai mostrato il nome del giorno. Al suo posto
     compaiono informazioni realmente utili durante l'allenamento — in
     ordine di preferenza:
       1. "{Round|Serie} X/Y"          (se roundTotal > 0)
       2. "Set X/Y"                    (se setsTotal > 0)
       3. Solo la pill "X%"            (fallback)
     La pill % resta sempre visibile a fianco.

   Safe area / notch / gesture nav (Sprint 9.1A #4):
     - `top: env(safe-area-inset-top)` in sticky mode → sotto al notch iOS.
     - padding L/R = `max(pad-x, env(safe-area-inset-{left,right}))`
       per la gesture navigation Android e il landscape con notch.
     - `@media (orientation: landscape) and (max-height: 500px)` riduce
       body max-height, gap, padding-y per non mangiare la viewport.
   ========================================================================== */

import { esc, attr, clamp } from '../Shared/helpers.js';
import { icon as renderIcon } from '../Shared/Icon.js';

/**
 * Factory: emette l'HTML del session header.
 *
 * @param {Object} opts
 * @param {'sticky'|'immersive'|'rest'} [opts.mode='sticky']
 * @param {string} [opts.title='Workout']            Titolo giorno (mostrato solo in expanded).
 * @param {string} [opts.subtitle]                   Sottotitolo (escapato).
 * @param {string} [opts.subtitleHtml]               Sottotitolo HTML (già sicuro).
 * @param {number} [opts.round]                      Round/serie corrente (1-based).
 * @param {number} [opts.roundTotal]                 Totale round → segments count.
 * @param {string} [opts.roundLabel='Round']         Etichetta ('Round'|'Serie'|'Giro').
 * @param {number} [opts.setsDone]                   Serie completate (fallback compact info).
 * @param {number} [opts.setsTotal]                  Serie totali (fallback compact info).
 * @param {string} [opts.backAction='go-home']       '' per nasconderlo.
 * @param {string} [opts.menuAction='session-open']  '' per nasconderlo.
 * @param {string} [opts.actions]                    HTML slot per il body (badge + Vista + Inizio).
 * @param {string} [opts.compactCta]                 HTML CTA compatta. Se assente, sintetizzata.
 * @param {string} [opts.compactCtaLabel='Continua'] Testo CTA compatta.
 * @param {string} [opts.compactCtaAction='begin-workout'] data-action CTA compatta.
 * @param {number} [opts.progress]                   0-100 percentuale sessione.
 * @param {string} [opts.sessionTime]                Solo per mode='rest': "MM:SS" del tempo di sessione da mostrare a destra.
 * @param {string} [opts.restLabel='RECUPERO']       Solo per mode='rest': titolo centrale.
 */
export function WorkoutStickyHeader(opts = {}) {
  const mode = opts.mode === 'immersive' ? 'immersive'
             : opts.mode === 'rest'      ? 'rest'
             : 'sticky';
  const isImmersive = mode === 'immersive';
  const isRest      = mode === 'rest';

  const title       = opts.title || 'Workout';
  const roundLabel  = opts.roundLabel || 'Round';
  const round       = Math.max(0, Number(opts.round)      || 0);
  const roundTotal  = Math.max(0, Number(opts.roundTotal) || 0);
  const setsDone    = Math.max(0, Number(opts.setsDone)   || 0);
  const setsTotal   = Math.max(0, Number(opts.setsTotal)  || 0);
  const pct         = clamp(Number(opts.progress) || 0, 0, 100);
  const pctRounded  = Math.round(pct);

  const backHtml = opts.backAction !== ''
    ? `<button type="button"
                class="c-wsh__iconBtn c-wsh__iconBtn--back"
                data-action="${esc(opts.backAction || 'go-home')}"
                aria-label="Indietro">
          ${renderIcon('arrow', 'medium')}
       </button>`
    : '<span class="c-wsh__iconSlot" aria-hidden="true"></span>';

  const menuHtml = opts.menuAction !== ''
    ? `<button type="button"
                class="c-wsh__iconBtn c-wsh__iconBtn--menu"
                data-action="${esc(opts.menuAction || 'session-open')}"
                aria-label="Menu sessione">
          ${renderIcon('settings', 'medium')}
       </button>`
    : '<span class="c-wsh__iconSlot" aria-hidden="true"></span>';

  // Segments (usati sia in sticky expanded sia in immersive).
  let segmentsHtml = '';
  if (roundTotal > 0) {
    const cur = Math.max(1, Math.min(round || 1, roundTotal));
    let segs = '';
    for (let i = 1; i <= roundTotal; i++) {
      const state = i < cur ? ' is-done' : (i === cur ? ' is-active' : '');
      segs += `<span class="c-wsh__seg${state}" aria-hidden="true"></span>`;
    }
    segmentsHtml = `
      <div class="c-wsh__segments"
           role="progressbar"
           aria-valuemin="1"
           aria-valuemax="${roundTotal}"
           aria-valuenow="${cur}"
           aria-label="${esc(roundLabel)} ${cur} di ${roundTotal}">
        ${segs}
      </div>`;
  }

  /* ---- Rest: variante compact statica per la Rest Scene ------------------
     Layout: ← | RECUPERO | mm:ss | ⋮ + hairline sempre visibile in fondo.
     Nessun morphing, nessun body espanso, nessun compact CTA. */
  if (isRest) {
    const restLabel   = opts.restLabel || 'RECUPERO';
    const sessionTime = opts.sessionTime || '';
    const timerHtml = sessionTime
      ? `<span class="c-wsh__restTimer" data-session-time>${esc(sessionTime)}</span>`
      : '<span class="c-wsh__restTimer c-wsh__restTimer--empty" aria-hidden="true"></span>';
    return `<header ${attr({
      class: 'c-wsh c-wsh--rest',
      'aria-label': 'Recupero in corso',
      'data-progress': String(pctRounded),
      'data-mode': 'rest',
    })}>
      <div class="c-wsh__topbar">
        ${backHtml}
        <div class="c-wsh__center">
          <span class="c-wsh__restTitle">${esc(restLabel)}</span>
        </div>
        ${timerHtml}
        ${menuHtml}
      </div>
      <span class="c-wsh__hairline c-wsh__hairline--rest" aria-hidden="true">
        <i style="width:${pct.toFixed(2)}%"></i>
      </span>
    </header>`;
  }

  /* ---- Immersive: variante piatta per la scena focus-single -------------- */
  if (isImmersive) {
    const r = round || 1;
    const t = roundTotal || 1;
    return `<header ${attr({
      class: 'c-wsh c-wsh--immersive',
      'aria-label': 'Progresso ' + (roundLabel || 'round'),
      'data-immersive': '1',
    })}>
      <div class="c-wsh__topbar">
        ${backHtml}
        <div class="c-wsh__center">
          <div class="c-wsh__immersiveTitle" role="status" aria-live="polite">
            <span class="c-wsh__immersiveLabel">${esc(roundLabel)}</span>
            <span class="c-wsh__immersiveValue">${r}</span>
            <span class="c-wsh__immersiveSep">di</span>
            <span class="c-wsh__immersiveTotal">${t}</span>
          </div>
        </div>
        ${menuHtml}
      </div>
      ${segmentsHtml}
    </header>`;
  }

  /* ---- Sticky: morphing expanded ↔ compact ------------------------------- */
  const subtitleInner = opts.subtitleHtml
    ? String(opts.subtitleHtml)
    : (opts.subtitle ? esc(opts.subtitle) : '');
  const subtitleHtml = subtitleInner
    ? `<p class="c-wsh__subtitle">${subtitleInner}</p>`
    : '';

  const actionsHtml = opts.actions
    ? `<div class="c-wsh__actions">${opts.actions}</div>`
    : '';

  // Compact info: MAI il nome del giorno. Priorità:
  //   1) Round X/Y     (se roundTotal>0)
  //   2) Set X/Y       (se setsTotal>0)
  //   3) solo pct pill (già presente in aggiunta).
  let compactInfo = '';
  if (roundTotal > 0) {
    const r = Math.max(1, Math.min(round || 1, roundTotal));
    compactInfo = `${roundLabel} ${r}/${roundTotal}`;
  } else if (setsTotal > 0) {
    compactInfo = `Set ${setsDone}/${setsTotal}`;
  }
  const compactInfoHtml = compactInfo
    ? `<span class="c-wsh__compactInfo" role="status" aria-live="polite">${esc(compactInfo)}</span>`
    : '<span class="c-wsh__compactInfo c-wsh__compactInfo--pct-only" aria-hidden="true"></span>';

  const compactCta = opts.compactCta
    ? opts.compactCta
    : `<button type="button"
                class="c-wsh__compactCta"
                data-action="${esc(opts.compactCtaAction || 'begin-workout')}"
                aria-label="${esc(opts.compactCtaLabel || 'Continua')}">
          <span class="c-wsh__compactCtaIcon" aria-hidden="true">▶</span>
          <span class="c-wsh__compactCtaLabel">${esc(opts.compactCtaLabel || 'Continua')}</span>
       </button>`;

  return `<header ${attr({
    class: 'c-wsh',
    'aria-label': 'Header sessione',
    'data-collapsed': '0',
    'data-progress': String(pctRounded),
    style: '--collapse:0',
  })}>
    <div class="c-wsh__topbar">
      ${backHtml}
      <div class="c-wsh__center">
        <div class="c-wsh__expandedSlot" data-slot="expanded">
          ${segmentsHtml}
        </div>
        <div class="c-wsh__compactSlot" data-slot="compact" aria-hidden="true">
          ${compactInfoHtml}
          <span class="c-wsh__compactPct" aria-hidden="true">${pctRounded}%</span>
          ${compactCta}
        </div>
      </div>
      ${menuHtml}
    </div>

    <div class="c-wsh__body" data-slot="expanded">
      <h1 class="c-wsh__title">${esc(title)}</h1>
      ${subtitleHtml}
      ${actionsHtml}
    </div>

    <span class="c-wsh__hairline" aria-hidden="true">
      <i style="width:${pct.toFixed(2)}%"></i>
    </span>
  </header>`;
}

/* -------------------------------------------------------------------------- */
/* Mount: attacca lo scroll listener throttled con requestAnimationFrame.      */
/* Ritorna una funzione di teardown; safe da chiamare più volte (idempotente). */
/* No-op se rootEl è la variante immersive (nessuno stato di scroll da gestire) */
/* -------------------------------------------------------------------------- */

const THRESHOLD = 160;           // pixel di scroll per raggiungere collapse=1
const COLLAPSED_AT = 0.55;       // soglia per commutare pointer-events / aria-hidden
const _MOUNTED = new WeakMap();  // rootEl → teardown()

/**
 * Attacca lo scroll observer. Idempotente: se il root è già montato,
 * disconnette il precedente listener prima di ricreare (utile dopo un
 * re-render che rigenera il DOM). No-op in modalità immersive.
 * @param {HTMLElement} rootEl  il <header class="c-wsh">
 * @returns {() => void}        funzione di teardown
 */
export function mountWorkoutStickyHeader(rootEl) {
  if (!rootEl || !(rootEl instanceof HTMLElement)) return () => {};
  if (rootEl.dataset && rootEl.dataset.immersive === '1') return () => {};
  const prev = _MOUNTED.get(rootEl);
  if (prev) prev();

  let rafId = 0;
  let lastY = -1;

  const apply = () => {
    rafId = 0;
    const y = window.scrollY || window.pageYOffset || 0;
    if (y === lastY) return;
    lastY = y;
    const raw = Math.max(0, Math.min(1, y / THRESHOLD));
    // Ease-out cubic: 1 - (1-x)^3 — la compressione parte netta poi rallenta
    // sui millisecondi finali, allineandosi al "feel" premium richiesto.
    const eased = 1 - Math.pow(1 - raw, 3);
    rootEl.style.setProperty('--collapse', eased.toFixed(4));

    const isCollapsed = eased >= COLLAPSED_AT;
    const attrVal = isCollapsed ? '1' : '0';
    if (rootEl.dataset.collapsed !== attrVal) {
      rootEl.dataset.collapsed = attrVal;
      const expandedSlots = rootEl.querySelectorAll('[data-slot="expanded"]');
      const compactSlots  = rootEl.querySelectorAll('[data-slot="compact"]');
      expandedSlots.forEach(el => el.setAttribute('aria-hidden', isCollapsed ? 'true' : 'false'));
      compactSlots.forEach(el  => el.setAttribute('aria-hidden', isCollapsed ? 'false' : 'true'));
    }
  };

  const onScroll = () => {
    if (rafId) return;
    rafId = requestAnimationFrame(apply);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  // Prima valutazione sincrona per allineare stato iniziale (utile se la
  // pagina è stata restorata a scrollY>0 dopo un back/forward).
  apply();

  const teardown = () => {
    if (rafId) cancelAnimationFrame(rafId);
    window.removeEventListener('scroll', onScroll);
    _MOUNTED.delete(rootEl);
  };
  _MOUNTED.set(rootEl, teardown);
  return teardown;
}

/**
 * Aggiorna in-place la hairline di progresso e la pill % compatta senza
 * ri-emettere l'header. Grazie alla `transition: width` sulla `<i>` interna,
 * la barra scorre morbidamente (200ms ease-out) invece di saltare.
 * @param {HTMLElement} rootEl
 * @param {number} pct  0-100
 */
export function setWorkoutStickyProgress(rootEl, pct) {
  if (!rootEl) return;
  const p = clamp(Number(pct) || 0, 0, 100);
  rootEl.dataset.progress = String(Math.round(p));
  const fill = rootEl.querySelector('.c-wsh__hairline > i');
  if (fill) fill.style.width = p.toFixed(2) + '%';
  const pctEl = rootEl.querySelector('.c-wsh__compactPct');
  if (pctEl) pctEl.textContent = Math.round(p) + '%';
}
