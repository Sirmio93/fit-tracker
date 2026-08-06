/* ==========================================================================
   Shared/Icon.js
   Sistema icone. Ogni icona è un SVG inline con `currentColor`, così può
   essere tinta via CSS (`color: var(--color-primary)`).
   Coerente con Blueprint v2 §11 (glossario simboli): dove il glossario
   ammette un carattere Unicode, lo esponiamo come glifo testuale; le icone
   non canoniche (dumbbell, play, pause, star, trophy) sono SVG dedicati.
   ========================================================================== */

const SVG_WRAP = (children, size = 'medium') =>
  `<svg class="c-icon c-icon--${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${children}</svg>`;

/* ---- SVG (icone non canoniche del Blueprint) ---- */
const SVG = {
  dumbbell: SVG_WRAP('<path d="M6 8v8M4 10v4M18 8v8M20 10v4M8 12h8"/>'),
  play:     SVG_WRAP('<path d="M8 5v14l11-7z" fill="currentColor" stroke="none"/>'),
  pause:    SVG_WRAP('<rect x="7" y="5" width="3.5" height="14" rx="1" fill="currentColor" stroke="none"/><rect x="13.5" y="5" width="3.5" height="14" rx="1" fill="currentColor" stroke="none"/>'),
  star:     SVG_WRAP('<path d="M12 3l2.9 6 6.6.9-4.8 4.7 1.1 6.5L12 18l-5.9 3.1 1.1-6.5L2.5 9.9 9 9z" fill="currentColor" stroke="none"/>'),
  trophy:   SVG_WRAP('<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z"/><path d="M17 6h2a2 2 0 0 1 0 4h-2M7 6H5a2 2 0 0 0 0 4h2"/>'),
  chart:    SVG_WRAP('<path d="M3 3v18h18"/><path d="M7 15l4-6 4 4 5-8"/>'),
  settings: SVG_WRAP('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>'),
  arrow:    SVG_WRAP('<path d="M9 6l6 6-6 6"/>'),
  arrowUp:  SVG_WRAP('<path d="M12 19V5M5 12l7-7 7 7"/>'),
  arrowDown:SVG_WRAP('<path d="M12 5v14M19 12l-7 7-7-7"/>'),
  home:     SVG_WRAP('<path d="M3 12l9-9 9 9M5 10v10h14V10"/>'),
  user:     SVG_WRAP('<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>'),
  bell:     SVG_WRAP('<path d="M18 16H6l1.5-2v-4a4.5 4.5 0 0 1 9 0v4z"/><path d="M10 20a2 2 0 0 0 4 0"/>'),
};

/* ---- Glifi canonici (Blueprint §11) — esposti come <span> ---- */
const GLYPH = {
  up:     '↑',
  down:   '↓',
  check:  '✓',
  dot:    '•',
  circle: '○',
  close:  '✕',
  disc:   '●',
  minus:  '−',
  plus:   '+',
};

/**
 * Ritorna l'HTML string di un'icona. Se il nome mappa a un SVG dedicato,
 * ritorna quello (tintabile via `color`); altrimenti prova come glifo
 * Unicode ammesso dal Blueprint.
 * @param {string} name
 * @param {'small'|'medium'|'large'|'xl'} [size='medium']
 */
export function icon(name, size = 'medium') {
  if (SVG[name]) {
    if (size === 'medium') return SVG[name];
    return SVG[name].replace('c-icon--medium', `c-icon--${size}`);
  }
  if (GLYPH[name]) {
    return `<span class="c-icon c-icon--${size} c-icon--glyph" aria-hidden="true">${GLYPH[name]}</span>`;
  }
  return `<span class="c-icon c-icon--${size}" aria-hidden="true"></span>`;
}

/** Set nomi ammessi — utile per debug / test. */
export const iconNames = Object.freeze([...Object.keys(SVG), ...Object.keys(GLYPH)]);
