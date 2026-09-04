/* ==========================================================================
   data/blockTypes.js
   Catalogo statico dei 9 tipi di blocco supportati dall'app.
   Ogni voce descrive la famiglia di esecuzione (per instradare la Focus Mode
   al renderer corretto) e i metadati usati dai config sheet e dagli editor.

   T0.2 (2026-08-14) · PROGETTO_MOCKUP — data-only, nessun consumer wired.
   Il file è ESM e non ha effetti collaterali: chi lo importa (T1.5, T2.5-2.7)
   riusa `BLOCK_TYPES` come tabella di verita per grid tipi, campi condizionali
   del config sheet e branching del runtime execution.

   Famiglie execution
   ------------------
   - 'single'  → un esercizio per volta con set/reps (Single, Core, HIIT, Pyramid).
                 Rest applicato tra i set. Pyramid usa `repsScale` per lo scaling.
   - 'circuit' → più esercizi in giro, rest SOLO a fine giro (Circuit ≡ Superset).
                 Vedi feedback_focus_mode_design.md.
   - 'timed'   → cronometro guida l'esecuzione (Tabata, EMOM, AMRAP).
                 Tabata usa work/rest per N cicli. EMOM: intervalli fissi.
                 AMRAP: timeCap complessivo, si contano i giri.
   ========================================================================== */

export const BLOCK_TYPES = Object.freeze([
  Object.freeze({
    id: 'Single',
    label: 'Singolo',
    familyExec: 'single',
    defaultRounds: 3,
    hasWorkRest: false,
    hasScale: false,
    hasTimeCap: false,
    icon: 'dumbbell',
  }),
  Object.freeze({
    id: 'Superset',
    label: 'Superserie',
    familyExec: 'circuit',
    defaultRounds: 3,
    hasWorkRest: false,
    hasScale: false,
    hasTimeCap: false,
    icon: 'layers',
  }),
  Object.freeze({
    id: 'Circuit',
    label: 'Circuito',
    familyExec: 'circuit',
    defaultRounds: 3,
    hasWorkRest: false,
    hasScale: false,
    hasTimeCap: false,
    icon: 'repeat',
  }),
  Object.freeze({
    id: 'Core',
    label: 'Core',
    familyExec: 'single',
    defaultRounds: 3,
    hasWorkRest: false,
    hasScale: false,
    hasTimeCap: false,
    icon: 'target',
  }),
  Object.freeze({
    id: 'Tabata',
    label: 'Tabata',
    familyExec: 'timed',
    defaultRounds: 8,
    hasWorkRest: true,
    hasScale: false,
    hasTimeCap: false,
    icon: 'timer',
  }),
  Object.freeze({
    id: 'HIIT',
    label: 'HIIT',
    familyExec: 'single',
    defaultRounds: 4,
    hasWorkRest: true,
    hasScale: false,
    hasTimeCap: false,
    icon: 'flame',
  }),
  Object.freeze({
    id: 'Pyramid',
    label: 'Piramide',
    familyExec: 'single',
    defaultRounds: 5,
    hasWorkRest: false,
    hasScale: true,
    hasTimeCap: false,
    icon: 'triangle',
  }),
  Object.freeze({
    id: 'EMOM',
    label: 'EMOM',
    familyExec: 'timed',
    defaultRounds: 10,
    hasWorkRest: false,
    hasScale: false,
    hasTimeCap: false,
    icon: 'clock',
  }),
  Object.freeze({
    id: 'AMRAP',
    label: 'AMRAP',
    familyExec: 'timed',
    defaultRounds: 1,
    hasWorkRest: false,
    hasScale: false,
    hasTimeCap: true,
    icon: 'infinity',
  }),
]);

export const BLOCK_TYPES_BY_ID = Object.freeze(
  BLOCK_TYPES.reduce(function (acc, t) { acc[t.id] = t; return acc; }, Object.create(null))
);

export function getBlockType(id) {
  return BLOCK_TYPES_BY_ID[id] || null;
}
