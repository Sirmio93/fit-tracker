/* ==========================================================================
   Anatomy/geometry.js — geometria condivisa del manichino anatomico.
   Silhouette + primitive muscolari (fronte/retro), etichette IT e set
   dei muscoli visibili solo sul retro. Consumato da AnatomyModel (dual
   pane) e da ExerciseVisual (single pane con logica auto front/back).

   Solo dati/constants: nessuna dipendenza runtime. Le coordinate sono
   stilizzate per riconoscibilità, non accuratezza anatomica.
   ========================================================================== */

/* Etichette IT dei gruppi muscolari (UI-only, per aria-label). */
export const MUSCLE_LABELS = Object.freeze({
  'chest':        'Petto',
  'upper-back':   'Dorso alto',
  'lats':         'Dorsali',
  'lower-back':   'Lombari',
  'front-delts':  'Deltoide anteriore',
  'side-delts':   'Deltoide laterale',
  'rear-delts':   'Deltoide posteriore',
  'biceps':       'Bicipiti',
  'triceps':      'Tricipiti',
  'forearms':     'Avambracci',
  'core':         'Core',
  'quads':        'Quadricipiti',
  'hamstrings':   'Femorali',
  'glutes':       'Glutei',
  'calves':       'Polpacci',
  'adductors':    'Adduttori',
  'abductors':    'Abduttori',
});

/* Silhouette (identica per fronte/retro). ViewBox 0 0 100 220. */
export const SILHOUETTE = `
  <circle cx="50" cy="18" r="11"/>
  <rect   x="46" y="27" width="8" height="6" rx="2"/>
  <path d="M 34 32 Q 50 30 66 32 L 68 44 L 68 92 Q 68 96 64 96 L 36 96 Q 32 96 32 92 L 32 44 Z"/>
  <path d="M 32 34 Q 22 36 22 44 L 22 100 Q 22 106 26 106 L 30 106 Q 34 106 34 100 L 34 40 Z"/>
  <path d="M 68 34 Q 78 36 78 44 L 78 100 Q 78 106 74 106 L 70 106 Q 66 106 66 100 L 66 40 Z"/>
  <path d="M 32 92 L 68 92 L 70 114 L 30 114 Z"/>
  <path d="M 32 114 L 48 114 L 48 206 Q 48 210 44 210 L 36 210 Q 32 210 32 206 Z"/>
  <path d="M 52 114 L 68 114 L 68 206 Q 68 210 64 210 L 56 210 Q 52 210 52 206 Z"/>
`;

/* Geometria muscoli — vista frontale. */
export const FRONT_MUSCLES = Object.freeze({
  'chest': [
    { t: 'ellipse', cx: 42, cy: 45, rx: 9, ry: 7 },
    { t: 'ellipse', cx: 58, cy: 45, rx: 9, ry: 7 },
  ],
  'front-delts': [
    { t: 'ellipse', cx: 32, cy: 38, rx: 5, ry: 4 },
    { t: 'ellipse', cx: 68, cy: 38, rx: 5, ry: 4 },
  ],
  'side-delts': [
    { t: 'ellipse', cx: 25, cy: 43, rx: 4, ry: 5 },
    { t: 'ellipse', cx: 75, cy: 43, rx: 4, ry: 5 },
  ],
  'biceps': [
    { t: 'ellipse', cx: 26, cy: 60, rx: 5, ry: 10 },
    { t: 'ellipse', cx: 74, cy: 60, rx: 5, ry: 10 },
  ],
  'forearms': [
    { t: 'ellipse', cx: 27, cy: 85, rx: 5, ry: 12 },
    { t: 'ellipse', cx: 73, cy: 85, rx: 5, ry: 12 },
  ],
  'core': [
    { t: 'rect', x: 41, y: 60, w: 18, h: 30, rx: 4 },
  ],
  'quads': [
    { t: 'ellipse', cx: 41, cy: 140, rx: 7, ry: 22 },
    { t: 'ellipse', cx: 59, cy: 140, rx: 7, ry: 22 },
  ],
  'adductors': [
    { t: 'ellipse', cx: 45, cy: 140, rx: 2.5, ry: 20 },
    { t: 'ellipse', cx: 55, cy: 140, rx: 2.5, ry: 20 },
  ],
  'calves': [
    { t: 'ellipse', cx: 41, cy: 182, rx: 6, ry: 14 },
    { t: 'ellipse', cx: 59, cy: 182, rx: 6, ry: 14 },
  ],
});

/* Geometria muscoli — vista posteriore. */
export const BACK_MUSCLES = Object.freeze({
  'upper-back': [
    { t: 'rect', x: 34, y: 36, w: 32, h: 20, rx: 4 },
  ],
  'lats': [
    { t: 'ellipse', cx: 38, cy: 68, rx: 6, ry: 12 },
    { t: 'ellipse', cx: 62, cy: 68, rx: 6, ry: 12 },
  ],
  'lower-back': [
    { t: 'rect', x: 40, y: 78, w: 20, h: 14, rx: 3 },
  ],
  'rear-delts': [
    { t: 'ellipse', cx: 32, cy: 38, rx: 5, ry: 4 },
    { t: 'ellipse', cx: 68, cy: 38, rx: 5, ry: 4 },
  ],
  'side-delts': [
    { t: 'ellipse', cx: 25, cy: 43, rx: 4, ry: 5 },
    { t: 'ellipse', cx: 75, cy: 43, rx: 4, ry: 5 },
  ],
  'triceps': [
    { t: 'ellipse', cx: 26, cy: 60, rx: 5, ry: 12 },
    { t: 'ellipse', cx: 74, cy: 60, rx: 5, ry: 12 },
  ],
  'forearms': [
    { t: 'ellipse', cx: 27, cy: 85, rx: 5, ry: 12 },
    { t: 'ellipse', cx: 73, cy: 85, rx: 5, ry: 12 },
  ],
  'glutes': [
    { t: 'ellipse', cx: 42, cy: 105, rx: 8, ry: 7 },
    { t: 'ellipse', cx: 58, cy: 105, rx: 8, ry: 7 },
  ],
  'hamstrings': [
    { t: 'ellipse', cx: 41, cy: 140, rx: 7, ry: 22 },
    { t: 'ellipse', cx: 59, cy: 140, rx: 7, ry: 22 },
  ],
  'calves': [
    { t: 'ellipse', cx: 41, cy: 182, rx: 6, ry: 14 },
    { t: 'ellipse', cx: 59, cy: 182, rx: 6, ry: 14 },
  ],
  'abductors': [
    { t: 'ellipse', cx: 33, cy: 118, rx: 3.5, ry: 8 },
    { t: 'ellipse', cx: 67, cy: 118, rx: 3.5, ry: 8 },
  ],
});

/* Muscoli visibili SOLO nella vista posteriore. Usato dalla logica
   'auto': se tutti i muscoli primari sono in questo set, mostra retro. */
export const BACK_ONLY_MUSCLES = new Set([
  'upper-back', 'lats', 'lower-back', 'rear-delts',
  'triceps', 'glutes', 'hamstrings',
]);

/* Utility: converte una primitiva geometrica in stringa SVG. */
export function shapeToSvg(s) {
  if (s.t === 'ellipse') return `<ellipse cx="${s.cx}" cy="${s.cy}" rx="${s.rx}" ry="${s.ry}"/>`;
  if (s.t === 'rect')    return `<rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" rx="${s.rx || 0}"/>`;
  return '';
}
