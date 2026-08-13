// Screenshot helper — Phase 2.3 visual validation.
// Copre due scene aggiuntive:
//   1) Circuit List — workout scene non-focus con un blocco circuit di 3
//      esercizi (Bench Press, Squat, Barbell Row): ogni card è renderizzata
//      via ExerciseHeroCard → ExerciseIdentity (size='sm') con badge auto.
//   2) Rest Overlay — attiva startRestTimer per riprodurre l'overlay a schermo
//      intero: NextExerciseCard usa ExerciseIdentity (size='sm').
// Uso: node sandbox/snap-circuit-rest.mjs
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, 'screenshots');
const BASE = 'http://127.0.0.1:8765/';

const MOBILE  = { width: 390, height: 844 };
const DESKTOP = { width: 1280, height: 900 };
const THEME = 'dark';

async function shot(page, name, { fullPage = true } = {}) {
  const file = path.join(OUT, name);
  await page.screenshot({ path: file, fullPage });
  console.log('SAVED', file);
}

async function waitAppReady(page) {
  await page.waitForFunction(() => {
    const v = document.getElementById('view');
    return !!v && v.children.length > 0;
  }, { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(400);
}

async function seedCircuit(page, { withRest }) {
  await page.evaluate(async () => {
    await new Promise((res) => {
      const r = indexedDB.deleteDatabase('fit-circuit-tracker-v18-optional-day');
      r.onsuccess = res; r.onerror = res; r.onblocked = res;
    });
  });
  await page.reload({ waitUntil: 'load' });
  await waitAppReady(page);

  await page.evaluate(async (opts) => {
    try { localStorage.setItem('user.name', 'Marco'); } catch(_) {}
    if (typeof resetAndLoad === 'function') { await resetAndLoad(); }
    if (!S.user) S.user = { name: '' };
    S.user.name = 'Marco';

    const c = S.cards[0]; const w = c && c.weeks[0]; const d = w && w.days[0];
    if (!(c && w && d)) return;

    // Tre esercizi mappati nel catalogo → badge auto (category+equipment).
    const benchId  = 'demo-bench-'  + Date.now();
    const squatId  = 'demo-squat-'  + Date.now();
    const rowId    = 'demo-row-'    + Date.now();
    S.exercises.push(
      { id: benchId, name: 'Bench Press',  primary: 'Pettorale · Tricipite',
        primaryMuscles: ['chest'], secondaryMuscles: ['triceps','front-delts'],
        source:'demo', createdAt: now(), updatedAt: now() },
      { id: squatId, name: 'Squat',        primary: 'Quadricipite · Glutei',
        primaryMuscles: ['quads'], secondaryMuscles: ['glutes','hamstrings'],
        source:'demo', createdAt: now(), updatedAt: now() },
      { id: rowId,   name: 'Barbell Row',  primary: 'Dorso · Bicipite',
        primaryMuscles: ['upper-back'], secondaryMuscles: ['lats','biceps'],
        source:'demo', createdAt: now(), updatedAt: now() },
    );

    const circuitBlock = {
      id: 'demo-circuit-' + Date.now(),
      type: 'circuit',
      label: 'Full Body Circuit',
      rounds: 3,
      restSec: 90,
      exerciseIds: [benchId, squatId, rowId],
      exerciseTargets: {
        [benchId]: { reps: '10-12' },
        [squatId]: { reps: '10-12' },
        [rowId]:   { reps: '10-12' },
      },
    };
    d.blocks.unshift(circuitBlock);
    await Store.put('cards', c);

    await startDay(c.id, w.key, d.key);
    beginWorkout();
    if (S.active) S.active.startedAt = new Date(Date.now() - 12*60*1000).toISOString();

    // Progresso parziale: primo esercizio 1a serie fatta, seconda in corso.
    const l1 = logFor(circuitBlock.id, benchId, 1, true);
    l1.kg = 40; l1.reps = '12'; l1.done = true; l1.updatedAt = now();
    const l2 = logFor(circuitBlock.id, squatId, 1, true);
    l2.kg = 60; l2.reps = '12'; l2.done = true; l2.updatedAt = now();

    // Focus OFF → il workoutBlock circuit si vede come lista (details aperto)
    // con una card ExerciseHeroCard per esercizio (ExerciseIdentity size='sm').
    S.focus = { on: false, blockIdx: 0, round: 1 };
    S.tab = 'workout';
    persistActive(true);

    if (opts.withRest && typeof startRestTimer === 'function') {
      // Simula riposo dopo aver chiuso il primo giro: 90s totali, ~62s residui.
      startRestTimer(90, 'Full Body Circuit • G1');
      if (S.timer) {
        S.timer.startedAt = Date.now() - 28*1000;
        S.timer.end       = Date.now() + 62*1000;
      }
    }
    render();
  }, { withRest });
  await page.waitForTimeout(500);
}

async function run(viewport, filename, opts) {
  const browser = await chromium.launch({ channel: 'chrome' });
  const context = await browser.newContext({ viewport, deviceScaleFactor: 2, colorScheme: 'dark' });
  const page = await context.newPage();
  page.on('pageerror', (err) => console.log('PAGE ERROR:', err.message));
  page.on('console', (msg) => { if (msg.type() === 'error') console.log('CONSOLE ERROR:', msg.text()); });

  await page.goto(BASE, { waitUntil: 'load' });
  await page.evaluate((theme) => {
    try { localStorage.setItem('theme', theme); } catch(_){}
    try { localStorage.setItem('user.name', 'Marco'); } catch(_){}
    try { localStorage.setItem('workout.swipeHint.dismissed', '1'); } catch(_){}
  }, THEME);
  await page.reload({ waitUntil: 'load' });
  await waitAppReady(page);
  await seedCircuit(page, opts);
  // Rest overlay è position:fixed → cattura solo la viewport per evitare
  // di renderizzare il contenuto scrollabile dietro l'overlay.
  await shot(page, filename, { fullPage: !opts.withRest });
  await browser.close();
}

console.log('→ circuit list mobile');
await run(MOBILE,  'phase2-circuit-mobile.png',  { withRest: false });
console.log('→ circuit list desktop');
await run(DESKTOP, 'phase2-circuit-desktop.png', { withRest: false });
console.log('→ rest overlay mobile');
await run(MOBILE,  'phase2-rest-mobile.png',     { withRest: true });
console.log('→ rest overlay desktop');
await run(DESKTOP, 'phase2-rest-desktop.png',    { withRest: true });
console.log('done');
