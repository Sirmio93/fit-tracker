/* ==========================================================================
   Execution/CountdownRing.js — T2.5 (PROGETTO_MOCKUP)
   Ring SVG countdown/countup riusabile per timer full-screen. Estratto da
   TabataTimer per essere consumato anche da EMOM (T2.6, centerContent =
   "N/target reps") e AMRAP (T2.6, direction='up').

   Puro rendering (HTML string) + una funzione imperativa `setRingProgress`
   per aggiornare in-place stroke-dashoffset / testo / colore senza
   ri-renderizzare tutto il subtree (usata dal loop rAF del TabataTimer).

   API — renderCountdownRing({
     total,           num — durata totale in unità coerenti con remaining (sec)
     remaining,       num — quanto manca alla fine (o quanto trascorso se direction='up')
     size            [num=246] px del box (svg square)
     stroke          [num=12]  spessore del path
     color           ['accent'|'muted'|'text'|css string]  colore path fill
     phase           ['work'|'rest'|null]  usato come data-attr per styling
     direction       ['down'|'up']  ('up' = ring che si riempie da 0 a total)
     id              [str]  id del root (per targeting in setRingProgress)
     centerContent   [str HTML]  se assente → "<remaining><small>sec</small>"
   })  → HTML string

   API — setRingProgress(el, {remaining, total, phase, color, centerContent})
     el = root .ex-ring (o child); trova path + label e li muta in-place.
   ========================================================================== */

import { esc, attr, clamp } from '../Shared/helpers.js';

function pickStroke(colorKey) {
  if (colorKey === 'muted')  return 'var(--color-textMuted, rgba(255,255,255,.28))';
  if (colorKey === 'text')   return 'var(--color-primary, #FFFFFF)';
  if (colorKey === 'accent') return 'var(--color-accent, #EAB308)';
  if (colorKey && /^#|^rgb|^var\(/.test(colorKey)) return colorKey;
  return 'var(--color-accent, #EAB308)';
}

function defaultCenter(remaining) {
  const s = Math.max(0, Math.round(+remaining || 0));
  return String(s) + '<small class="ex-ring__unit">sec</small>';
}

/**
 * @param {Object} p
 * @returns {string} HTML
 */
export function renderCountdownRing(p) {
  const opts      = p || {};
  const size      = Math.max(80, +opts.size || 246);
  const stroke    = Math.max(2, +opts.stroke || 12);
  const total     = Math.max(1, +opts.total || 20);
  const remaining = clamp(+opts.remaining != null ? +opts.remaining : total, 0, total);
  const direction = opts.direction === 'up' ? 'up' : 'down';
  const phase     = opts.phase || null;
  const color     = pickStroke(opts.color || 'accent');
  const id        = opts.id || null;

  const r = (size - stroke * 2) / 2;
  const cx = size / 2, cy = size / 2;
  const C = 2 * Math.PI * r;

  // ratio traveled: down = elapsed/total; up = filled/total
  const elapsed = direction === 'up' ? remaining : (total - remaining);
  const ratio   = clamp(elapsed / total, 0, 1);
  const offset  = direction === 'up'
    ? C * (1 - ratio)   // riempie da 0 a total (partenza 0, finale C)
    : C * ratio;        // svuota da total a 0

  const centerHtml = opts.centerContent != null && opts.centerContent !== ''
    ? String(opts.centerContent)
    : defaultCenter(remaining);

  const rootAttrs = attr({
    class: 'ex-ring' + (phase ? ' ex-ring--phase-' + phase : ''),
    id: id,
    role: 'timer',
    'aria-live': 'off',
    'data-total': total,
    'data-remaining': remaining,
    'data-direction': direction,
    'data-phase': phase,
    style: 'width:' + size + 'px;height:' + size + 'px',
  });

  return '<div ' + rootAttrs + '>'
    +   '<svg class="ex-ring__svg" viewBox="0 0 ' + size + ' ' + size + '" aria-hidden="true">'
    +     '<circle class="ex-ring__bg" cx="' + cx + '" cy="' + cy + '" r="' + r + '"'
    +           ' stroke-width="' + stroke + '" fill="none"/>'
    +     '<circle class="ex-ring__fill" cx="' + cx + '" cy="' + cy + '" r="' + r + '"'
    +           ' stroke="' + esc(color) + '" stroke-width="' + stroke + '"'
    +           ' stroke-linecap="round" fill="none"'
    +           ' stroke-dasharray="' + C.toFixed(2) + '"'
    +           ' stroke-dashoffset="' + offset.toFixed(2) + '"'
    +           ' transform="rotate(-90 ' + cx + ' ' + cy + ')"'
    +           ' data-circumference="' + C.toFixed(2) + '"/>'
    +   '</svg>'
    +   '<div class="ex-ring__center">' + centerHtml + '</div>'
    + '</div>';
}

/**
 * Aggiorna in-place il ring senza toccare il resto del DOM.
 * Chiamato dal loop rAF ~30-60 fps.
 * @param {HTMLElement} el  root .ex-ring
 * @param {Object} p        {remaining, total?, phase?, color?, centerContent?}
 */
export function setRingProgress(el, p) {
  if (!el || !p) return;
  const root = el.classList && el.classList.contains('ex-ring')
    ? el
    : el.querySelector && el.querySelector('.ex-ring');
  if (!root) return;
  const fill = root.querySelector('.ex-ring__fill');
  const centerEl = root.querySelector('.ex-ring__center');
  if (!fill) return;

  const total = p.total != null ? Math.max(1, +p.total) : Math.max(1, +root.dataset.total || 20);
  const remaining = clamp(+p.remaining != null ? +p.remaining : total, 0, total);
  const direction = root.dataset.direction === 'up' ? 'up' : 'down';
  const C = +fill.dataset.circumference || (2 * Math.PI * (parseFloat(fill.getAttribute('r')) || 0));
  const elapsed = direction === 'up' ? remaining : (total - remaining);
  const ratio = clamp(elapsed / total, 0, 1);
  const offset = direction === 'up' ? C * (1 - ratio) : C * ratio;
  fill.setAttribute('stroke-dashoffset', offset.toFixed(2));

  if (p.color) fill.setAttribute('stroke', pickStroke(p.color));
  if (p.phase) {
    root.classList.remove('ex-ring--phase-work', 'ex-ring--phase-rest');
    root.classList.add('ex-ring--phase-' + p.phase);
    root.dataset.phase = p.phase;
  }
  root.dataset.total = total;
  root.dataset.remaining = remaining;

  if (p.centerContent != null) {
    if (centerEl) centerEl.innerHTML = String(p.centerContent);
  } else if (centerEl) {
    centerEl.innerHTML = defaultCenter(remaining);
  }
}
