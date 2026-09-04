/* ==========================================================================
   CreateWorkout/BlockConfigSheet.js — T1.5 · Config sheet blocco.

   Bottom sheet full-height (~92vh) che permette di scegliere il tipo di
   blocco tra i 9 disponibili (data/blockTypes.js) e di configurare i campi
   specifici del tipo: giri/rest per i legacy, work/rest/cicli per Tabata,
   scala reps/kg per Pyramid, ecc.

   Aperta da due data-action nel BlockCard (T1.4):
     · create-block-open-config + data-block-id  → mode="edit"
     · create-block-open-config senza id          → mode="new"

   Su Save:
     · mode=edit → sostituisce il blocco in draft.weeks[w].days[d].blocks[b]
       preservando `exerciseIds` e `exerciseTargets` (esercizi invariati).
     · mode=new  → append di un blocco vuoto (exercises=[]) al giorno attivo.
   In entrambi i casi imposta S.editor.isDirty = true e ri-renderizza l'app.

   Consumer di:
     · components/Feedback/BottomSheet.js → showBottomSheet() (scrim + focus
       trap + esc + drag). NON ricrea backdrop / sheet logic da zero.
     · components/Shared/helpers.js       → esc(), uid()
     · data/blockTypes.js                 → BLOCK_TYPES + BLOCK_TYPES_BY_ID
     · ./BlockTypeIcons.js                → getBlockTypeIcon()

   Palette: bianco + giallo (accent #EAB308). Zero viola. Selezione tipo
   attiva = fill giallo (border+icon+testo neri); non selezionato = outline
   neutro. Timeline Tabata preview = 8 barrette alternate giallo/grigio.

   API pubblica:
     openBlockConfigSheet({ mode, blockId })  → { close } | null
     renderBlockConfigContent(block, opts)    → HTML string (esposto per test)
   ========================================================================== */

import { esc, uid } from '../Shared/helpers.js';
import { showBottomSheet } from '../Feedback/BottomSheet.js';
import { BLOCK_TYPES, BLOCK_TYPES_BY_ID } from '../../data/blockTypes.js';
import { getBlockTypeIcon } from './BlockTypeIcons.js';

/* ---- Metadati UI-only per la griglia tipi ------------------------------
   Descrizione breve (mockup Device C) e flag "Nuovo" (tipi introdotti in
   T0.2: Pyramid, EMOM, AMRAP; Tabata è pre-esistente ma con nuovo config
   condizionale — segnalato come "Nuovo" per attirare attenzione). */
const TYPE_UI = {
  Single:   { subtitle: '1 esercizio · N set', badge: null },
  Superset: { subtitle: '2-3 esercizi',        badge: null },
  Circuit:  { subtitle: '4+ a giri',           badge: null },
  Tabata:   { subtitle: '20″/10″ × 8',         badge: 'Nuovo' },
  HIIT:     { subtitle: 'Alta intensità',      badge: null },
  Pyramid:  { subtitle: 'Scala reps/peso',     badge: 'Nuovo' },
  EMOM:     { subtitle: 'Ogni minuto',         badge: 'Nuovo' },
  AMRAP:    { subtitle: 'Max giri in T min',   badge: 'Nuovo' },
  Core:     { subtitle: 'Addome',              badge: null },
};

// Ordine di rendering per la griglia 3×3 — allinea al mockup Device C.
const TYPE_ORDER = ['Single', 'Superset', 'Circuit', 'Tabata', 'Pyramid', 'EMOM', 'AMRAP', 'HIIT', 'Core'];

// Note contestuali mostrate sotto la griglia. Testi che esplicano la
// semantica di esecuzione (Circuit ≡ Superset, Tabata timer, ecc.) —
// coerenti con feedback_focus_mode_design.md e project_focus_mode_design.md.
const TYPE_NOTES = {
  Single:   'Un solo esercizio ripetuto per N set con rest fra un set e il successivo.',
  Superset: 'Due o tre esercizi a giro, senza rest tra un esercizio e l\'altro. Rest solo a fine giro.',
  Circuit:  'Quattro o più esercizi eseguiti a giri consecutivi. Rest solo a fine giro (semantica identica al Superset).',
  Tabata:   'Timer automatico work → rest × cicli. La Focus Mode mostra un esercizio alla volta a schermo pieno.',
  HIIT:     'Alta intensità: work/rest ripetuti. Focus Mode single-exercise con countdown esplicito.',
  Pyramid:  'Scala reps per set (es. 12→10→8→6→4). Il peso può essere pre-fillato per set.',
  EMOM:     'Every Minute On the Minute: parti ogni cycles-esimo intervallo, completi le reps, riposi il resto.',
  AMRAP:    'As Many Rounds As Possible: nel time cap fai più giri possibili degli esercizi del blocco.',
  Core:     'Un solo esercizio dedicato al core, con set e rest tradizionali.',
};

/* ---- Defaults sensati per ogni tipo (applicati al cambio tipo se il
   campo non è già impostato). Nessun default sovrascrive un valore
   esistente — l'edit conserva sempre le scelte utente precedenti. */
const TYPE_DEFAULTS = {
  Single:   { rounds: 3, restSec: 60 },
  Superset: { rounds: 3, restSec: 60 },
  Circuit:  { rounds: 3, restSec: 90 },
  Core:     { rounds: 3, restSec: 60 },
  Tabata:   { rounds: 1, workSec: 20, restSec: 10, cycles: 8 },
  HIIT:     { rounds: 4, workSec: 30, restSec: 30 },
  Pyramid:  { rounds: 5, restSec: 120, repsScale: [{ reps: 12 }, { reps: 10 }, { reps: 8 }, { reps: 6 }, { reps: 4 }] },
  EMOM:     { rounds: 1, workSec: 60, cycles: 10 },
  AMRAP:    { rounds: 1, timeCapSec: 300 },
};

/* ---- Range dei bumper degli stepper (protegge da valori assurdi). */
const RANGES = {
  rounds:      { min: 1,  max: 30,   step: 1  },
  restSec:     { min: 0,  max: 600,  step: 5  },
  workSec:     { min: 5,  max: 300,  step: 5  },
  cycles:      { min: 1,  max: 30,   step: 1  },
  timeCapSec:  { min: 60, max: 3600, step: 30 },
};

/* ==========================================================================
   Helpers puri (nessuna dipendenza da S / DOM globale).
   ========================================================================== */

function deepCopyBlock(b) {
  const copy = Object.assign({}, b || {});
  if (Array.isArray(b && b.exerciseIds))   copy.exerciseIds = b.exerciseIds.slice();
  if (b && b.exerciseTargets && typeof b.exerciseTargets === 'object') {
    copy.exerciseTargets = {};
    for (const k in b.exerciseTargets) if (Object.prototype.hasOwnProperty.call(b.exerciseTargets, k)) {
      copy.exerciseTargets[k] = Object.assign({}, b.exerciseTargets[k]);
    }
  }
  if (Array.isArray(b && b.repsScale)) {
    copy.repsScale = b.repsScale.map(function (s) { return Object.assign({}, s); });
  }
  return copy;
}

function createEmptyBlock() {
  return {
    id: uid('b'),
    section: 'circuito',
    type: 'Single',
    label: '',
    restText: '',
    restSec: TYPE_DEFAULTS.Single.restSec,
    rounds:  TYPE_DEFAULTS.Single.rounds,
    exerciseIds: [],
    exerciseTargets: {},
  };
}

function applyTypeDefaults(block) {
  const type = block.type;
  const defs = TYPE_DEFAULTS[type] || {};
  if (defs.rounds     && !(Number(block.rounds)     > 0)) block.rounds     = defs.rounds;
  if (defs.restSec    != null && !(Number(block.restSec)    > 0)) block.restSec    = defs.restSec;
  if (defs.workSec    != null && !(Number(block.workSec)    > 0)) block.workSec    = defs.workSec;
  if (defs.cycles     != null && !(Number(block.cycles)     > 0)) block.cycles     = defs.cycles;
  if (defs.timeCapSec != null && !(Number(block.timeCapSec) > 0)) block.timeCapSec = defs.timeCapSec;
  if (defs.repsScale && (!Array.isArray(block.repsScale) || !block.repsScale.length)) {
    block.repsScale = defs.repsScale.map(function (s) { return Object.assign({}, s); });
  }
}

function parseRepsScale(text) {
  const list = String(text || '').split(/[,\s]+/).map(function (s) { return s.trim(); }).filter(Boolean);
  const out = [];
  for (let i = 0; i < list.length; i++) {
    const n = Number(list[i]);
    if (!Number.isFinite(n) || n < 1 || n > 100) continue;
    out.push({ reps: Math.floor(n) });
  }
  return out;
}

function repsScaleToText(scale) {
  if (!Array.isArray(scale)) return '';
  return scale.map(function (s) { return s && s.reps != null ? String(s.reps) : ''; }).filter(Boolean).join(',');
}

function clampRange(field, value) {
  const r = RANGES[field]; if (!r) return value;
  if (value < r.min) return r.min;
  if (value > r.max) return r.max;
  return value;
}

function fmtSec(v) {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return '0';
  return String(n);
}

function fmtTabataTotal(workSec, restSec, cycles) {
  const w = Math.max(0, Number(workSec) || 0);
  const r = Math.max(0, Number(restSec) || 0);
  const c = Math.max(0, Number(cycles) || 0);
  const totalSec = (w + r) * c;
  if (totalSec <= 0) return '0″';
  if (totalSec < 60) return totalSec + '″';
  const m = totalSec / 60;
  return (Number.isInteger(m) ? String(m) : m.toFixed(1)) + '′';
}

/* ==========================================================================
   Rendering — HTML pure functions. Nessun mount handler qui.
   ========================================================================== */

function renderTypeCard(type, activeType) {
  const meta = BLOCK_TYPES_BY_ID[type];
  if (!meta) return '';
  const ui   = TYPE_UI[type] || { subtitle: '', badge: null };
  const isOn = type === activeType;
  const cls  = 'cw-cfg-type' + (isOn ? ' is-on' : '');
  const badge = ui.badge
    ? '<span class="cw-cfg-type__badge">' + esc(ui.badge) + '</span>'
    : '';
  return '' +
    '<button type="button" role="radio"' +
      ' aria-checked="' + (isOn ? 'true' : 'false') + '"' +
      ' class="' + cls + '"' +
      ' data-cfg-type="' + esc(type) + '"' +
      ' data-block-type="' + esc(type) + '">' +
      badge +
      '<span class="cw-cfg-type__i" aria-hidden="true">' + getBlockTypeIcon(type) + '</span>' +
      '<span class="cw-cfg-type__t">' + esc(meta.label) + '</span>' +
      '<span class="cw-cfg-type__s">' + esc(ui.subtitle) + '</span>' +
    '</button>';
}

function renderTypeGrid(activeType) {
  const cards = TYPE_ORDER.map(function (t) { return renderTypeCard(t, activeType); }).join('');
  return '' +
    '<div class="cw-cfg-type-grid" role="radiogroup" aria-label="Tipo di blocco">' +
      cards +
    '</div>';
}

function renderStepper(field, value, unit, label) {
  const r = RANGES[field] || { step: 1 };
  const step = r.step;
  const v = Number(value) || 0;
  return '' +
    '<div class="cw-cfg-field">' +
      '<label class="cw-cfg-lbl">' + esc(label) + '</label>' +
      '<div class="cw-cfg-stepper">' +
        '<button type="button" class="cw-cfg-stepper__b"' +
          ' data-cfg-step="dec" data-cfg-field="' + esc(field) + '" data-cfg-step-size="' + step + '"' +
          ' aria-label="Diminuisci ' + esc(label) + '">−</button>' +
        '<div class="cw-cfg-stepper__v" data-cfg-value="' + esc(field) + '">' +
          esc(String(v)) +
          '<small>' + esc(unit) + '</small>' +
        '</div>' +
        '<button type="button" class="cw-cfg-stepper__b"' +
          ' data-cfg-step="inc" data-cfg-field="' + esc(field) + '" data-cfg-step-size="' + step + '"' +
          ' aria-label="Aumenta ' + esc(label) + '">+</button>' +
      '</div>' +
    '</div>';
}

function renderTabataViz(block) {
  const work = fmtSec(block.workSec);
  const rest = fmtSec(block.restSec);
  const cyc  = fmtSec(block.cycles);
  const tot  = fmtTabataTotal(block.workSec, block.restSec, block.cycles);
  const segs = [];
  for (let i = 0; i < 8; i++) {
    segs.push('<span class="cw-cfg-viz__seg cw-cfg-viz__seg--w" aria-hidden="true">W</span>');
    segs.push('<span class="cw-cfg-viz__seg cw-cfg-viz__seg--r" aria-hidden="true">R</span>');
  }
  return '' +
    '<div class="cw-cfg-viz" data-cfg-slot="viz">' +
      '<div class="cw-cfg-viz__label">Anteprima ciclo</div>' +
      '<div class="cw-cfg-viz__track" role="img" aria-label="Anteprima 8 cicli Tabata alternati">' +
        segs.join('') +
      '</div>' +
      '<div class="cw-cfg-viz__foot">' +
        '<span data-cfg-viz-foot="work"><b>' + esc(work) + '″</b> lavoro</span>' +
        '<span data-cfg-viz-foot="rest"><b>' + esc(rest) + '″</b> riposo</span>' +
        '<span data-cfg-viz-foot="tot"><b>' + esc(cyc) + '</b> cicli · <b>' + esc(tot) + '</b> tot</span>' +
      '</div>' +
    '</div>';
}

function renderRepsScaleField(block) {
  const text = repsScaleToText(block.repsScale);
  return '' +
    '<div class="cw-cfg-field">' +
      '<label class="cw-cfg-lbl" for="cw-cfg-reps-scale">Scala reps (es. 12,10,8,6,4)</label>' +
      '<input type="text" class="cw-cfg-input" id="cw-cfg-reps-scale"' +
        ' data-cfg-input="repsScale" inputmode="numeric" autocomplete="off"' +
        ' value="' + esc(text) + '" placeholder="12,10,8,6,4" />' +
      '<p class="cw-cfg-hint" data-cfg-slot="reps-scale-hint">' +
        (text ? esc(text.split(',').length + ' set: ' + text.replace(/,/g, ' → ')) : 'Almeno 2 valori separati da virgola') +
      '</p>' +
    '</div>';
}

function renderConditionalFields(block) {
  const type = block.type;

  if (type === 'Tabata') {
    return '' +
      renderTabataViz(block) +
      '<div class="cw-cfg-row">' +
        renderStepper('workSec', block.workSec, 'sec', 'Lavoro') +
        renderStepper('restSec', block.restSec, 'sec', 'Riposo') +
      '</div>' +
      renderStepper('cycles', block.cycles, 'cicli', 'Cicli per esercizio');
  }

  if (type === 'HIIT') {
    return '' +
      '<div class="cw-cfg-row">' +
        renderStepper('workSec', block.workSec, 'sec', 'Lavoro') +
        renderStepper('restSec', block.restSec, 'sec', 'Riposo') +
      '</div>' +
      renderStepper('rounds', block.rounds, 'giri', 'Giri');
  }

  if (type === 'EMOM') {
    return '' +
      '<div class="cw-cfg-row">' +
        renderStepper('cycles',  block.cycles,  'min', 'Cicli (minuti)') +
        renderStepper('workSec', block.workSec, 'sec', 'Intervallo') +
      '</div>' +
      renderStepper('timeCapSec', block.timeCapSec || 0, 'sec', 'Time cap (opzionale)');
  }

  if (type === 'AMRAP') {
    return renderStepper('timeCapSec', block.timeCapSec, 'sec', 'Time cap');
  }

  if (type === 'Pyramid') {
    return '' +
      renderRepsScaleField(block) +
      '<div class="cw-cfg-row">' +
        renderStepper('rounds',  block.rounds,  'set', 'Set') +
        renderStepper('restSec', block.restSec, 'sec', 'Riposo') +
      '</div>';
  }

  // Single / Superset / Circuit / Core
  const roundsLabel = (type === 'Single' || type === 'Core') ? 'Set' : 'Giri';
  return '' +
    '<div class="cw-cfg-row">' +
      renderStepper('rounds',  block.rounds,  roundsLabel.toLowerCase(), roundsLabel) +
      renderStepper('restSec', block.restSec, 'sec', 'Riposo') +
    '</div>';
}

function renderNote(type) {
  const label = (BLOCK_TYPES_BY_ID[type] && BLOCK_TYPES_BY_ID[type].label) || type;
  const body = TYPE_NOTES[type] || '';
  return '' +
    '<aside class="cw-cfg-note" role="note" data-cfg-slot="note">' +
      '<div class="cw-cfg-note__dot" aria-hidden="true"></div>' +
      '<p class="cw-cfg-note__body"><b>' + esc(label) + '</b> ' + esc(body) + '</p>' +
    '</aside>';
}

/**
 * Rende l'HTML completo del contenuto della sheet (senza wrapper .c-bottomSheet,
 * che viene aggiunto da showBottomSheet).
 * Esposto anche come export per i test snapshot.
 * @param {Object} block  — draft in-memory (copia locale).
 * @param {Object} opts   — { mode: 'edit' | 'new' }.
 */
export function renderBlockConfigContent(block, opts) {
  const mode = (opts && opts.mode) || 'edit';
  const title = mode === 'new' ? 'Nuovo blocco' : 'Configura blocco';
  const cta   = mode === 'new' ? 'Aggiungi blocco' : 'Conferma configurazione';

  return '' +
    '<div class="cw-cfg" data-cfg-mode="' + esc(mode) + '">' +
      '<header class="cw-cfg__hd">' +
        '<h2 class="cw-cfg__title">' + esc(title) + '</h2>' +
        '<button type="button" class="cw-cfg__x" data-cfg-close aria-label="Chiudi">✕</button>' +
      '</header>' +

      '<div class="cw-cfg__body">' +
        '<div class="cw-cfg-field">' +
          '<label class="cw-cfg-lbl" for="cw-cfg-name">Nome del blocco</label>' +
          '<input type="text" class="cw-cfg-input" id="cw-cfg-name"' +
            ' data-cfg-input="label" maxlength="80"' +
            ' value="' + esc(block.label || '') + '" placeholder="Es. Circuito 1 · Petto" autocomplete="off" />' +
        '</div>' +

        '<label class="cw-cfg-lbl cw-cfg-lbl--block">Tipo di blocco</label>' +
        renderTypeGrid(block.type) +

        '<div data-cfg-slot="conditional">' +
          renderConditionalFields(block) +
        '</div>' +

        renderNote(block.type) +
      '</div>' +

      '<div class="cw-cfg__cta-bar">' +
        '<button type="button" class="cw-cfg__cta" data-cfg-save>' + esc(cta) + '</button>' +
      '</div>' +
    '</div>';
}

/* ==========================================================================
   Mount + logic — chiuso in openBlockConfigSheet().
   ========================================================================== */

function resolveSelectedDay(draft, ui) {
  if (!draft || !Array.isArray(draft.weeks) || !draft.weeks.length) return null;
  let wIdx = 0;
  if (ui && ui.selectedWeek != null) {
    if (typeof ui.selectedWeek === 'string') {
      const idx = draft.weeks.findIndex(function (w) { return w && w.key === ui.selectedWeek; });
      if (idx >= 0) wIdx = idx;
    } else if (Number.isFinite(Number(ui.selectedWeek))) {
      wIdx = Math.max(0, Math.min(draft.weeks.length - 1, Number(ui.selectedWeek)));
    }
  }
  const week = draft.weeks[wIdx];
  if (!week || !Array.isArray(week.days) || !week.days.length) return null;
  let dIdx = 0;
  if (ui && ui.selectedDay != null) {
    if (typeof ui.selectedDay === 'string') {
      const idx = week.days.findIndex(function (d) { return d && d.key === ui.selectedDay; });
      if (idx >= 0) dIdx = idx;
    } else if (Number.isFinite(Number(ui.selectedDay))) {
      dIdx = Math.max(0, Math.min(week.days.length - 1, Number(ui.selectedDay)));
    }
  }
  return week.days[dIdx] || null;
}

/**
 * Rimuove dai campi opzionali quelli non pertinenti al tipo, per non
 * persistere `workSec` su un Circuit legacy o `repsScale` su un Tabata.
 */
function cleanupFieldsByType(block) {
  const type  = block.type;
  const meta  = BLOCK_TYPES_BY_ID[type] || {};
  const keeps = { restSec: true, rounds: true };
  if (meta.hasWorkRest) { keeps.workSec = true; keeps.restSec = true; }
  if (type === 'Tabata' || type === 'EMOM' || type === 'AMRAP') keeps.cycles = true;
  if (meta.hasTimeCap)  keeps.timeCapSec = true;
  if (meta.hasScale)    keeps.repsScale = true;
  ['workSec', 'restSec', 'cycles', 'timeCapSec', 'repsScale', 'rounds'].forEach(function (k) {
    if (!keeps[k] && block[k] != null) delete block[k];
  });
}

function commitBlockToDraft(sheetBlock, mode, blockId, day) {
  if (!day || !Array.isArray(day.blocks)) return false;
  cleanupFieldsByType(sheetBlock);

  if (mode === 'edit' && blockId) {
    const idx = day.blocks.findIndex(function (b) { return b && b.id === blockId; });
    if (idx < 0) return false;
    const original = day.blocks[idx];
    // Preserva exerciseIds + exerciseTargets: T1.5 configura il blocco,
    // il picker esercizi è T1.6 (fuori scope).
    const merged = Object.assign({}, original, sheetBlock);
    merged.id = original.id;
    merged.exerciseIds     = original.exerciseIds     || [];
    merged.exerciseTargets = original.exerciseTargets || {};
    // Pulisci di nuovo dopo il merge (il vecchio blocco poteva avere campi
    // rimasti obsoleti dopo il cambio tipo).
    cleanupFieldsByType(merged);
    day.blocks[idx] = merged;
    return true;
  }

  // mode === 'new'
  const fresh = Object.assign({}, sheetBlock);
  if (!fresh.id) fresh.id = uid('b');
  fresh.exerciseIds     = Array.isArray(fresh.exerciseIds)     ? fresh.exerciseIds     : [];
  fresh.exerciseTargets = fresh.exerciseTargets && typeof fresh.exerciseTargets === 'object' ? fresh.exerciseTargets : {};
  cleanupFieldsByType(fresh);
  day.blocks.push(fresh);
  return true;
}

function updateTypeGrid(root, newType) {
  const cards = root.querySelectorAll('[data-cfg-type]');
  cards.forEach(function (card) {
    const isOn = card.dataset.cfgType === newType;
    card.classList.toggle('is-on', isOn);
    card.setAttribute('aria-checked', isOn ? 'true' : 'false');
  });
}

function updateConditionalSlot(root, block) {
  const slot = root.querySelector('[data-cfg-slot="conditional"]');
  if (slot) slot.innerHTML = renderConditionalFields(block);
  const note = root.querySelector('[data-cfg-slot="note"]');
  if (note) {
    const nu = document.createElement('div');
    nu.innerHTML = renderNote(block.type);
    if (nu.firstElementChild) note.replaceWith(nu.firstElementChild);
  }
}

function updateStepperDisplay(root, field, value) {
  const el = root.querySelector('[data-cfg-value="' + field + '"]');
  if (!el) return;
  const unit = el.querySelector('small');
  const unitTxt = unit ? unit.textContent : '';
  el.textContent = String(value);
  if (unitTxt) {
    const s = document.createElement('small');
    s.textContent = unitTxt;
    el.appendChild(s);
  }
}

function updateTabataViz(root, block) {
  const foot = root.querySelector('[data-cfg-slot="viz"] .cw-cfg-viz__foot');
  if (!foot) return;
  const work = fmtSec(block.workSec);
  const rest = fmtSec(block.restSec);
  const cyc  = fmtSec(block.cycles);
  const tot  = fmtTabataTotal(block.workSec, block.restSec, block.cycles);
  foot.innerHTML = '' +
    '<span data-cfg-viz-foot="work"><b>' + esc(work) + '″</b> lavoro</span>' +
    '<span data-cfg-viz-foot="rest"><b>' + esc(rest) + '″</b> riposo</span>' +
    '<span data-cfg-viz-foot="tot"><b>' + esc(cyc) + '</b> cicli · <b>' + esc(tot) + '</b> tot</span>';
}

function updateRepsScaleHint(root, scale) {
  const h = root.querySelector('[data-cfg-slot="reps-scale-hint"]');
  if (!h) return;
  if (Array.isArray(scale) && scale.length) {
    const reps = scale.map(function (s) { return s && s.reps != null ? String(s.reps) : ''; }).filter(Boolean);
    h.textContent = reps.length + ' set: ' + reps.join(' → ');
  } else {
    h.textContent = 'Almeno 2 valori separati da virgola';
  }
}

/**
 * Apre il config sheet per un blocco esistente o nuovo.
 *
 * @param {Object}   opts
 * @param {'edit'|'new'} [opts.mode='edit']
 * @param {string}  [opts.blockId] — obbligatorio in mode='edit'.
 * @param {Function}[opts.onSaved]  — chiamato dopo il commit (mode, blockId).
 * @returns {{close: () => void} | null}
 */
export function openBlockConfigSheet(opts) {
  const options = opts || {};
  // `S` in app.js is declared with `const` and is not a window property.
  // The caller passes `state: S` explicitly; window.S is a fallback for
  // environments that do expose it (e.g. dev console, future refactor).
  const state = options.state || (typeof window !== 'undefined' ? window.S : null);
  if (!state || !state.editor || !state.editor.draft) return null;

  const draft = state.editor.draft;
  const ui    = state._ui || null;
  const day   = resolveSelectedDay(draft, ui);
  if (!day) return null;
  if (!Array.isArray(day.blocks)) day.blocks = [];

  const requestedMode = options.mode === 'new' ? 'new' : 'edit';
  let mode    = requestedMode;
  let blockId = options.blockId || null;
  let originalBlock = null;

  if (mode === 'edit' && blockId) {
    originalBlock = day.blocks.find(function (b) { return b && b.id === blockId; }) || null;
    if (!originalBlock) mode = 'new';
  }

  const sheetBlock = originalBlock ? deepCopyBlock(originalBlock) : createEmptyBlock();
  applyTypeDefaults(sheetBlock);

  const handle = showBottomSheet({
    title: '',
    content: renderBlockConfigContent(sheetBlock, { mode: mode }),
    dismissOnScrim: true,
    escToClose: true,
    draggable: false,
  });

  if (!handle || !handle.root) return null;
  const root = handle.root;

  // Marker per il CSS override (:has() based) e per i test.
  root.setAttribute('data-cfg-sheet', mode);
  root.classList.add('c-presenter--cfg');

  // Delegator locale — vive con il presenter, si smonta con esso.
  root.addEventListener('click', function (e) {
    const closeBtn = e.target.closest('[data-cfg-close]');
    if (closeBtn) { handle.close(); return; }

    const typeBtn = e.target.closest('[data-cfg-type]');
    if (typeBtn) {
      const nextType = typeBtn.dataset.cfgType;
      if (BLOCK_TYPES_BY_ID[nextType] && nextType !== sheetBlock.type) {
        sheetBlock.type = nextType;
        // Reset timed/scaled fields when switching types so the new type
        // always starts with its own canonical defaults (e.g. Tabata restSec=10,
        // not the Circuit's 90s carried over from the previous type).
        sheetBlock.workSec    = undefined;
        sheetBlock.restSec    = undefined;
        sheetBlock.cycles     = undefined;
        sheetBlock.timeCapSec = undefined;
        sheetBlock.repsScale  = undefined;
        applyTypeDefaults(sheetBlock);
        updateTypeGrid(root, nextType);
        updateConditionalSlot(root, sheetBlock);
      }
      return;
    }

    const stepBtn = e.target.closest('[data-cfg-step]');
    if (stepBtn) {
      const dir  = stepBtn.dataset.cfgStep === 'inc' ? 1 : -1;
      const field = stepBtn.dataset.cfgField;
      const step  = Number(stepBtn.dataset.cfgStepSize) || 1;
      const cur   = Number(sheetBlock[field]) || 0;
      const next  = clampRange(field, cur + dir * step);
      sheetBlock[field] = next;
      updateStepperDisplay(root, field, next);
      if (field === 'workSec' || field === 'restSec' || field === 'cycles') {
        updateTabataViz(root, sheetBlock);
      }
      return;
    }

    if (e.target.closest('[data-cfg-save]')) {
      const ok = commitBlockToDraft(sheetBlock, mode, blockId, day);
      if (ok) {
        state.editor.isDirty = true;
        handle.close();
        if (typeof window.render === 'function') window.render();
        if (typeof options.onSaved === 'function') options.onSaved({ mode: mode, blockId: blockId, block: sheetBlock });
      }
      return;
    }
  });

  root.addEventListener('input', function (e) {
    const el = e.target;
    if (!el || !el.dataset) return;
    if (el.dataset.cfgInput === 'label') {
      sheetBlock.label = String(el.value || '').slice(0, 80);
      return;
    }
    if (el.dataset.cfgInput === 'repsScale') {
      const parsed = parseRepsScale(el.value);
      // Preserva i kg per set esistenti (allineamento per indice).
      if (Array.isArray(sheetBlock.repsScale) && sheetBlock.repsScale.length && parsed.length) {
        parsed.forEach(function (step, i) {
          const prev = sheetBlock.repsScale[i];
          if (prev && prev.kg != null) step.kg = prev.kg;
        });
      }
      sheetBlock.repsScale = parsed;
      updateRepsScaleHint(root, parsed);
      return;
    }
  });

  return handle;
}

/* Named exports secondari — utili ai test / consumer avanzati. */
export { renderTypeGrid, renderConditionalFields, applyTypeDefaults };
