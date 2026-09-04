/* ==========================================================================
   CreateWorkout/ExercisePickerSheet.js — T1.6 · Exercise picker sheet.

   Overlay sheet full-height che si apre da BlockCard tramite
   data-action="create-block-add-exercise". Legge da S.editor.picker (stato
   UI session-only) + catalogo esercizi caricato via `services/catalogService`
   (T0.4). Multi-add: tap toggla la selezione; contatore in header + CTA
   giallo "Aggiungi (N)" (disabled se N=0).

   Filtri: doppia riga (categoria single-select + equipment multi-select).
   AND fra i due assi, OR all'interno di equipment. Lista raggruppata per
   muscolo primario (muscles[0]); ordine "usati di recente" (via
   catalogService.orderByUsage) poi alfabetico stabile.

   Thumbnail: ExerciseIdentity size="mini" — DS discipline (mai <img>).

   API pubblica (ESM):
     · renderExercisePickerSheet(picker, catalog, blockContext) → HTML string
     · renderExercisePickerFilters(picker, catalog)             → HTML string
     · renderExercisePickerListInner(picker, catalog)           → HTML string
     · pickerFilteredEntries(picker, catalog)                   → Exercise[]

   Data-actions consumati dal delegator di app.js:
     · picker-close             chiude il sheet (annulla)
     · picker-toggle-select     toggla la selezione riga (data-cid)
     · picker-filter-cat        set filtro categoria (data-cat="" = tutti)
     · picker-filter-eq         toggla filtro equipment (data-eq)
     · picker-confirm           conferma → append esercizi al blocco
   Input listener su #view: data-picker-input="search" → pickerSetQuery
   ========================================================================== */

import { esc } from '../Shared/helpers.js';
import { ExerciseIdentity } from '../Exercise/ExerciseIdentity.js';

/* Categorie: label breve per il chip, value = etichetta catalog reale. */
export const PICKER_CATEGORIES = Object.freeze([
  { label: 'Push',     value: 'Push' },
  { label: 'Pull',     value: 'Pull' },
  { label: 'Legs',     value: 'Legs' },
  { label: 'Core',     value: 'Core' },
  { label: 'Full',     value: 'Full body' },
  { label: 'Cardio',   value: 'Cardio' },
  { label: 'Mobility', value: 'Mobility' },
]);

export const PICKER_EQUIPMENT = Object.freeze([
  'Corpo libero',
  'Manubri',
  'Bilanciere',
  'Cavi',
  'Kettlebell',
  'Elastico',
  'Macchinario',
]);

/* ---- Utilities puri ------------------------------------------------------ */

function accentFold(s) {
  if (s == null) return '';
  return String(s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

function tokenize(q) {
  return accentFold(q).split(/\s+/).filter(Boolean);
}

function matchesQuery(entry, tokens) {
  if (!tokens.length) return true;
  const hay = accentFold(entry.name) + ' ' + accentFold((entry.muscles || []).join(' '));
  for (let i = 0; i < tokens.length; i++) {
    if (hay.indexOf(tokens[i]) === -1) return false;
  }
  return true;
}

/**
 * Applica search + filtri e ritorna la lista di catalog entries risultante.
 * @param {{query:string, filterCat:string|null, filterEq:string[]}} picker
 * @param {Array<{id,name,muscles,equipment,category}>} catalog
 * @returns {Array}
 */
export function pickerFilteredEntries(picker, catalog) {
  if (!Array.isArray(catalog) || !catalog.length) return [];
  const q = (picker && picker.query) || '';
  const cat = (picker && picker.filterCat) || null;
  const eqs = (picker && Array.isArray(picker.filterEq)) ? picker.filterEq : [];
  const tokens = tokenize(q);
  const eqSet = eqs.length ? new Set(eqs) : null;
  const out = [];
  for (let i = 0; i < catalog.length; i++) {
    const e = catalog[i];
    if (!e) continue;
    if (cat && e.category !== cat) continue;
    if (eqSet && !eqSet.has(e.equipment)) continue;
    if (!matchesQuery(e, tokens)) continue;
    out.push(e);
  }
  return out;
}

/* Raggruppa per muscolo primario (muscles[0]). Preserva l'ordine relativo. */
function groupByPrimaryMuscle(entries) {
  const order = [];
  const groups = Object.create(null);
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const key = (e.muscles && e.muscles[0]) ? String(e.muscles[0]) : 'Altri';
    if (!groups[key]) { groups[key] = []; order.push(key); }
    groups[key].push(e);
  }
  return order.map(function (k) { return { name: k, items: groups[k] }; });
}

/* ---- Sub-renderers ------------------------------------------------------- */

function renderSearchBar(picker) {
  const q = esc((picker && picker.query) || '');
  const n = (picker && Array.isArray(picker.selectedIds)) ? picker.selectedIds.length : 0;
  const badgeVisible = n > 0 ? '' : ' hidden';
  const svgIcon =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true">' +
      '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>' +
    '</svg>';
  return '' +
    '<div class="cw-picker__search">' +
      svgIcon +
      '<input type="text"' +
        ' class="cw-picker__search-in"' +
        ' data-picker-input="search"' +
        ' placeholder="Cerca esercizio…"' +
        ' autocomplete="off"' +
        ' spellcheck="false"' +
        ' value="' + q + '"' +
        ' aria-label="Cerca esercizio"' +
      ' />' +
      '<span class="cw-picker__count" data-picker-count' + badgeVisible + '>' + esc(String(n)) + '</span>' +
    '</div>';
}

function chipCountFor(catalog, predicate) {
  let c = 0;
  for (let i = 0; i < catalog.length; i++) if (predicate(catalog[i])) c += 1;
  return c;
}

export function renderExercisePickerFilters(picker, catalog) {
  const cat = (picker && picker.filterCat) || null;
  const eqs = (picker && Array.isArray(picker.filterEq)) ? picker.filterEq : [];
  const eqSet = new Set(eqs);
  const totalCount = Array.isArray(catalog) ? catalog.length : 0;

  const allChip =
    '<button type="button"' +
      ' class="cw-fchip' + (!cat ? ' cw-fchip--on' : '') + '"' +
      ' data-action="picker-filter-cat"' +
      ' data-cat=""' +
      ' aria-pressed="' + (!cat ? 'true' : 'false') + '"' +
    '>Tutti <span class="cw-fchip__cnt">' + esc(String(totalCount)) + '</span></button>';

  const catChips = PICKER_CATEGORIES.map(function (c) {
    const on = cat === c.value;
    const n = chipCountFor(catalog || [], function (e) { return e && e.category === c.value; });
    return '<button type="button"' +
      ' class="cw-fchip' + (on ? ' cw-fchip--on' : '') + '"' +
      ' data-action="picker-filter-cat"' +
      ' data-cat="' + esc(c.value) + '"' +
      ' aria-pressed="' + (on ? 'true' : 'false') + '"' +
    '>' + esc(c.label) + ' <span class="cw-fchip__cnt">' + esc(String(n)) + '</span></button>';
  }).join('');

  const eqChips = PICKER_EQUIPMENT.map(function (name) {
    const on = eqSet.has(name);
    return '<button type="button"' +
      ' class="cw-fchip' + (on ? ' cw-fchip--on' : '') + '"' +
      ' data-action="picker-filter-eq"' +
      ' data-eq="' + esc(name) + '"' +
      ' aria-pressed="' + (on ? 'true' : 'false') + '"' +
    '>' + esc(name) + '</button>';
  }).join('');

  return '' +
    '<div class="cw-picker__filters cw-picker__filters--cat" role="tablist" aria-label="Filtro categoria">' +
      allChip + catChips +
    '</div>' +
    '<div class="cw-picker__filters cw-picker__filters--eq" role="group" aria-label="Filtro attrezzatura">' +
      eqChips +
    '</div>';
}

function renderPickerRow(entry, selected) {
  const cls = 'cw-picker-row' + (selected ? ' cw-picker-row--selected' : '');
  const thumb = ExerciseIdentity({ name: entry.name, size: 'mini', className: 'cw-picker-row__id' });
  const musclesText = Array.isArray(entry.muscles) && entry.muscles.length
    ? entry.muscles.join(' · ')
    : (entry.equipment || '');
  const glyph = selected ? '✓' : '+';
  return '' +
    '<button type="button"' +
      ' class="' + cls + '"' +
      ' data-action="picker-toggle-select"' +
      ' data-cid="' + esc(entry.id) + '"' +
      ' aria-pressed="' + (selected ? 'true' : 'false') + '"' +
      ' aria-label="' + (selected ? 'Rimuovi ' : 'Aggiungi ') + esc(entry.name) + '"' +
    '>' +
      '<span class="cw-p-thumb" aria-hidden="true">' + thumb + '</span>' +
      '<span class="cw-p-info">' +
        '<span class="cw-p-name">' + esc(entry.name) + '</span>' +
        '<span class="cw-p-muscles">' + esc(musclesText) + '</span>' +
      '</span>' +
      '<span class="cw-p-add" aria-hidden="true">' + glyph + '</span>' +
    '</button>';
}

export function renderExercisePickerListInner(picker, catalog) {
  const entries = pickerFilteredEntries(picker, catalog || []);
  if (!entries.length) {
    return '' +
      '<div class="cw-picker__empty" role="status">' +
        '<p class="cw-picker__empty-t">Nessun esercizio trovato</p>' +
        '<p class="cw-picker__empty-s">Prova a rimuovere qualche filtro o cambia ricerca.</p>' +
      '</div>';
  }
  const selectedSet = new Set(
    (picker && Array.isArray(picker.selectedIds)) ? picker.selectedIds : []
  );
  const groups = groupByPrimaryMuscle(entries);
  const parts = [];
  for (let i = 0; i < groups.length; i++) {
    const g = groups[i];
    parts.push(
      '<div class="cw-picker__group">' +
        '<div class="cw-picker__cat">' +
          '<span>' + esc(g.name) + ' · ' + esc(String(g.items.length)) +
            (g.items.length === 1 ? ' esercizio' : ' esercizi') +
          '</span>' +
        '</div>' +
        g.items.map(function (e) { return renderPickerRow(e, selectedSet.has(e.id)); }).join('') +
      '</div>'
    );
  }
  return parts.join('');
}

function renderCta(picker) {
  const n = (picker && Array.isArray(picker.selectedIds)) ? picker.selectedIds.length : 0;
  const disabled = n === 0;
  const label = n > 0 ? ('Aggiungi (' + n + ')') : 'Seleziona esercizi';
  const cls = 'cw-picker__btn' + (n > 0 ? ' cw-picker__btn--accent' : '');
  return '' +
    '<button type="button"' +
      ' class="' + cls + '"' +
      ' data-action="picker-confirm"' +
      (disabled ? ' disabled aria-disabled="true"' : '') +
    '>' + esc(label) + '</button>';
}

function renderContextTitle(blockContext) {
  const blockLabel = (blockContext && blockContext.label) ? String(blockContext.label) : '';
  if (!blockLabel) return 'Scegli esercizi';
  return 'Scegli esercizi <small>al ' + esc(blockLabel) + '</small>';
}

/* ---- API pubblica -------------------------------------------------------- */

/**
 * Rende l'intero picker sheet come stringa HTML. Se `loading===true` mostra
 * uno spinner in place della lista (raro — DB catalog gia' seeded al boot).
 * @param {Object} picker         S.editor.picker
 * @param {Array}  catalog        catalog entries (o [] se non ancora caricato)
 * @param {Object} [blockContext] { id, label } — mostrato in header
 * @returns {string} HTML string
 */
export function renderExercisePickerSheet(picker, catalog, blockContext) {
  if (!picker || !picker.open) return '';

  const loading = !!picker.loading || !Array.isArray(catalog);
  const cat = Array.isArray(catalog) ? catalog : [];
  const titleHtml = renderContextTitle(blockContext);
  const searchHtml = renderSearchBar(picker);
  const filtersHtml = loading ? '' : renderExercisePickerFilters(picker, cat);
  const listHtml = loading
    ? ('<div class="cw-picker__spinner" role="status" aria-live="polite">' +
         '<div class="cw-picker__spinner-dot" aria-hidden="true"></div>' +
         '<p>Caricamento catalogo…</p>' +
       '</div>')
    : renderExercisePickerListInner(picker, cat);
  const ctaHtml = renderCta(picker);

  return '' +
    '<div class="cw-picker-overlay" data-open="true" aria-hidden="false">' +
      '<button type="button" class="cw-picker__scrim"' +
        ' data-action="picker-close"' +
        ' aria-label="Chiudi selezione esercizi"' +
        ' tabindex="-1">' +
      '</button>' +
      '<section class="cw-picker-sheet" role="dialog" aria-modal="true" aria-labelledby="cw-picker-title">' +
        '<div class="cw-picker-sheet__grab" aria-hidden="true"></div>' +
        '<header class="cw-picker__hd">' +
          '<h2 class="cw-picker__title" id="cw-picker-title">' + titleHtml + '</h2>' +
          '<button type="button" class="cw-picker__x"' +
            ' data-action="picker-close"' +
            ' aria-label="Chiudi selezione esercizi">✕</button>' +
        '</header>' +
        searchHtml +
        '<div class="cw-picker__filters-wrap">' + filtersHtml + '</div>' +
        '<div class="cw-picker__list" data-picker-list>' + listHtml + '</div>' +
        '<div class="cw-picker__cta">' + ctaHtml + '</div>' +
      '</section>' +
    '</div>';
}
