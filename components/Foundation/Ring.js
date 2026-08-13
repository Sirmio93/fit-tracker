/* ==========================================================================
   Foundation/Ring.js — Sprint 9.2B (Unified Ring System)
   Primitiva unica per QUALSIASI anello SVG del design system: progress ring,
   countdown ring, statistic ring, analytics ring. Sostituisce le
   implementazioni parallele (ProgressRing, CircularRestTimer, TodayCard
   inline SVG). I wrapper legacy diventano adapter che delegano qui.

   API completamente parametrica. Rendering SVG unico (mai duplicato).
   Motion via Motion Tokens. Glow via --glow-* tokens. Accessibilità
   role="progressbar" + aria-valuemin/max/now.

   Nessuna business logic: solo composizione HTML. Aggiornamenti in-place
   via `setRingProgress(el, value, max?)`.
   ========================================================================== */

import { esc, attr, cx, clamp } from '../Shared/helpers.js';

/* Named size presets → { diametro px, stroke default px } */
const SIZE_PRESETS = {
  xs: { size:  32, stroke:  3 },
  sm: { size:  48, stroke:  4 },
  md: { size:  96, stroke:  8 },
  lg: { size: 160, stroke: 12 },
  xl: { size: 260, stroke: 14 },
};

function resolvePreset(size) {
  if (typeof size === 'number' && size > 0) return { size, stroke: null, keyword: null };
  const key = typeof size === 'string' && SIZE_PRESETS[size] ? size : 'md';
  const p = SIZE_PRESETS[key];
  return { size: p.size, stroke: p.stroke, keyword: key };
}

function resolveStroke(strokeOpt, presetStroke) {
  if (typeof strokeOpt === 'number' && strokeOpt > 0) return strokeOpt;
  return presetStroke != null ? presetStroke : 8;
}

/**
 * @param {Object} [opts]
 * @param {number} [opts.value=0]              — valore corrente (0..max)
 * @param {number} [opts.max=100]              — valore massimo
 * @param {number|'xs'|'sm'|'md'|'lg'|'xl'} [opts.size='md']
 * @param {number} [opts.stroke]               — override spessore (px)
 * @param {string} [opts.color='primary']      — primary|success|warning|error|neutral
 * @param {string} [opts.background='surface'] — track color: surface|subtle|transparent
 * @param {boolean} [opts.animated=true]       — abilita transizione stroke-dashoffset
 * @param {boolean} [opts.showLabel=false]     — mostra label % al centro (default)
 * @param {boolean} [opts.showGlow=false]      — applica --glow-* al ring
 * @param {string} [opts.label]                — override testo label (implica showLabel)
 * @param {string} [opts.centerHtml]           — HTML custom al centro (sovrascrive label)
 * @param {string} [opts.ariaLabel]            — aria-label del progressbar
 * @param {string} [opts.role='progressbar']
 * @param {string} [opts.className]            — classi extra sul wrapper
 * @param {string} [opts.id]
 */
export function Ring(opts = {}) {
  const max = Math.max(1, +opts.max || 100);
  const rawValue = opts.value != null ? +opts.value : 0;
  const value = clamp(isFinite(rawValue) ? rawValue : 0, 0, max);
  const pct = (value / max) * 100;

  const preset = resolvePreset(opts.size != null ? opts.size : 'md');
  const size = preset.size;
  const stroke = resolveStroke(opts.stroke, preset.stroke);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - pct / 100);

  const color = opts.color || 'primary';
  const background = opts.background || 'surface';
  const animated = opts.animated !== false;
  const showGlow = opts.showGlow === true;
  const hasLabelText = opts.label != null;
  const showLabel = hasLabelText || opts.showLabel === true;
  const labelText = hasLabelText ? String(opts.label) : `${Math.round(pct)}%`;

  const centerHtml = opts.centerHtml
    ? String(opts.centerHtml)
    : (showLabel
        ? `<span class="c-ring__label"${hasLabelText ? ' data-custom="1"' : ''}>${esc(labelText)}</span>`
        : '');

  const cls = cx([
    'c-ring',
    `c-ring--color-${color}`,
    `c-ring--bg-${background}`,
    preset.keyword ? `c-ring--${preset.keyword}` : '',
    showGlow ? 'c-ring--glow' : '',
    animated ? '' : 'c-ring--static',
    opts.className || '',
  ]);

  const ariaLabel = opts.ariaLabel || labelText;

  return `<div ${attr({
    class: cls,
    id: opts.id,
    role: opts.role || 'progressbar',
    'aria-label': ariaLabel,
    'aria-valuemin': 0,
    'aria-valuemax': max,
    'aria-valuenow': Math.round(value),
    'data-value': value,
    'data-max': max,
    'data-size': size,
    'data-stroke': stroke,
    'data-animated': animated ? 'true' : 'false',
    style: `--ring-size:${size}px;`,
  })}>
    <svg class="c-ring__svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true" focusable="false">
      <circle class="c-ring__track" cx="${size/2}" cy="${size/2}" r="${r}" stroke-width="${stroke}" fill="none"/>
      <circle class="c-ring__fill"  cx="${size/2}" cy="${size/2}" r="${r}" stroke-width="${stroke}" fill="none" stroke-linecap="round"
        transform="rotate(-90 ${size/2} ${size/2})"
        stroke-dasharray="${c.toFixed(2)}" stroke-dashoffset="${off.toFixed(2)}"/>
    </svg>
    ${centerHtml ? `<div class="c-ring__center">${centerHtml}</div>` : ''}
  </div>`;
}

/**
 * Aggiorna in-place value (e opzionalmente max) senza rimontare il ring.
 * Rispetta la transizione CSS su stroke-dashoffset. Se il ring ha una label
 * auto-generata (senza data-custom), la label testuale viene riscritta.
 * @param {HTMLElement} el
 * @param {number} value
 * @param {number} [max]
 */
export function setRingProgress(el, value, max) {
  if (!el) return;
  const nextMax = max != null
    ? Math.max(1, +max || 100)
    : Math.max(1, parseFloat(el.dataset.max) || 100);
  const clamped = clamp(+value || 0, 0, nextMax);
  const size = parseFloat(el.dataset.size) || 96;
  const stroke = parseFloat(el.dataset.stroke) || 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = (clamped / nextMax) * 100;
  const off = c * (1 - pct / 100);
  const fill = el.querySelector('.c-ring__fill');
  if (fill) fill.setAttribute('stroke-dashoffset', off.toFixed(2));
  el.dataset.value = String(clamped);
  el.dataset.max = String(nextMax);
  el.setAttribute('aria-valuenow', String(Math.round(clamped)));
  el.setAttribute('aria-valuemax', String(nextMax));
  const lab = el.querySelector('.c-ring__label');
  if (lab && !lab.dataset.custom) lab.textContent = `${Math.round(pct)}%`;
}

/**
 * Cambia colore del ring runtime (es. countdown vira a success negli ultimi
 * secondi). Rimpiazza solo la modifier `c-ring--color-*`.
 * @param {HTMLElement} el
 * @param {string} color   primary|success|warning|error|neutral
 */
export function setRingColor(el, color) {
  if (!el || !color) return;
  const next = `c-ring--color-${color}`;
  const toRemove = [];
  el.classList.forEach(function (name) {
    if (name.indexOf('c-ring--color-') === 0 && name !== next) toRemove.push(name);
  });
  toRemove.forEach(function (name) { el.classList.remove(name); });
  el.classList.add(next);
}
