/* ==========================================================================
   CreateWorkout/CreateWorkoutShell.js — T1.1 shell + T1.2 hero + T1.3 nav
                                        + T1.4 blocks (read-only).
   Chrome navigabile per la route "Crea scheda". Il picker (T1.6) e il
   config sheet (T1.5) sono overlay che si aprono dai punti d'aggancio
   presenti nei blocchi (data-action stubs).

   Slot popolati:
     · [data-slot="hero"]   → renderHeroMeta(draft)                      · T1.2
     · [data-slot="nav"]    → renderWeekDayNav(draft, state._ui)         · T1.3
     · [data-slot="blocks"] → renderBlocks(draft, state.exercises, ui)   · T1.4
   Se il draft è null lo shell resta vuoto: no crash, no placeholder finto.

   API pubblica: renderCreateWorkoutShell(state) → HTML string.
   ========================================================================== */

import { esc } from '../Shared/helpers.js';
import { renderHeroMeta } from './HeroMeta.js';
import { renderWeekDayNav } from './WeekDayNav.js';
import { renderBlocks } from './BlockCard.js';
import { renderExercisePickerSheet } from './ExercisePickerSheet.js';

export function renderCreateWorkoutShell(state) {
  var draft   = state && state.editor && state.editor.draft ? state.editor.draft : null;
  var baseUi  = state && state._ui ? state._ui : null;
  var ui      = Object.assign({}, baseUi || {}, { blockMenuId: (state && state.editor && state.editor.blockMenuId) || null });
  var exercises = state && Array.isArray(state.exercises) ? state.exercises : [];
  var picker  = state && state.editor && state.editor.picker ? state.editor.picker : null;
  var catalog = state && state.editor && Array.isArray(state.editor.catalog) ? state.editor.catalog : null;

  // T1.3 · Auto-init dev-friendly: se il draft esiste ma weeks è vuoto o
  // mancante, seed con la sola settimana_a (specchia createEmptyDraft di T1.2).
  if (draft && (!Array.isArray(draft.weeks) || draft.weeks.length === 0)) {
    draft.weeks = [{ key: 'settimana_a', label: 'Settimana A', days: [] }];
  }

  var canSave = !!(draft && String(draft.name || '').trim().length > 0);
  var heroHtml   = draft ? renderHeroMeta(draft) : '';
  var navHtml    = draft ? renderWeekDayNav(draft, ui) : '';
  var blocksHtml = draft ? renderBlocks(draft, exercises, ui) : '';
  var showPlaceholder = !draft;
  var placeholderHtml = showPlaceholder
    ? '<p class="cw-placeholder">Contenuto in arrivo — T1.5</p>'
    : '';
  // T1.6 · Picker sheet — overlay full-height dentro la shell (position:absolute).
  // Il draft + block context vengono risolti in app.js e passati via picker.blockContext.
  var pickerHtml = (picker && picker.open)
    ? renderExercisePickerSheet(picker, catalog, picker.blockContext || null)
    : '';
  var bodyPlaceholder =
    '<div data-slot="hero">' + heroHtml + '</div>' +
    '<div data-slot="nav">'  + navHtml  + '</div>' +
    '<div data-slot="blocks">' + blocksHtml + '</div>' +
    placeholderHtml;

  return `<section class="cw-shell" aria-label="${esc('Crea scheda')}">
    <header class="cw-topbar" role="banner">
      <button
        type="button"
        class="cw-topbar__back"
        data-action="create-back"
        aria-label="${esc('Torna indietro')}"
      >‹</button>
      <h1 class="cw-topbar__title">${esc('Crea scheda')}</h1>
      <button
        type="button"
        class="cw-topbar__save"
        data-action="create-save"
        aria-label="${esc('Salva scheda')}"
        ${canSave ? '' : 'aria-disabled="true" disabled'}
      >${esc('Salva')}</button>
    </header>

    <div class="cw-body" id="createWorkoutBody">
      ${bodyPlaceholder}
    </div>

    <div class="cw-cta-bar" role="toolbar" aria-label="${esc('Azioni scheda')}">
      <button
        type="button"
        class="cw-cta cw-cta--ghost"
        data-action="create-preview"
        aria-disabled="true"
        disabled
      >${esc('Anteprima')}</button>
      <button
        type="button"
        class="cw-cta cw-cta--primary"
        data-action="create-save"
        aria-label="${esc('Salva scheda')}"
        ${canSave ? '' : 'aria-disabled="true" disabled'}
      >${esc('Salva')}</button>
    </div>
    ${pickerHtml}
  </section>`;
}
