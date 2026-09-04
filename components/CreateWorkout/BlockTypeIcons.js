/* ==========================================================================
   CreateWorkout/BlockTypeIcons.js — T1.5 · SVG per la griglia tipi.
   Set fisso di 9 icone (una per ogni tipo di blocco definito in
   data/blockTypes.js). Sono icone di "concetto blocco" (single, superset,
   circuito, tabata, ...) — NON sono thumbnail esercizi. Vivono in
   BlockConfigSheet e riflettono il tipo scelto nella type-grid.

   Stile: stroke bianco, fill nessuno, stroke-width 2, viewBox 24×24.
   Le dimensioni finali sono dettate dal container (.cw-cfg-type-i svg → 20×20).
   Nessun colore hardcoded: `currentColor` per rispettare il tema.
   ========================================================================== */

// Mappa id tipo → SVG string. Le forme replicano il mockup Device C.
const ICONS = {
  Single:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>',
  Superset: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 7h10l-2-2M17 17H7l2 2"/></svg>',
  Circuit:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>',
  Tabata:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/></svg>',
  Pyramid:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4 4 20h16z"/></svg>',
  EMOM:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  AMRAP:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 12c0-2 2-4 4-4s4 2 4 4-2 4-4 4M4 12c0-4 4-8 8-8s8 4 8 8-4 8-8 8"/></svg>',
  HIIT:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>',
  Core:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/></svg>',
};

const FALLBACK = ICONS.Single;

/** @param {string} typeId — es. 'Single', 'Tabata'. @returns {string} SVG. */
export function getBlockTypeIcon(typeId) {
  return ICONS[typeId] || FALLBACK;
}

/** Elenco degli id supportati (utile ai test). */
export const SUPPORTED_TYPE_ICONS = Object.freeze(Object.keys(ICONS));
