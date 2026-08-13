// Sprint 9.2 — Premium Rest Experience: screenshot mobile + desktop.
// Simula un blocco circuit da 3 esercizi con la prima serie completata,
// poi attiva startRestTimer per far comparire la nuova RestScene v2.
// Uso: node sandbox/snap-rest-v2.mjs
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT  = path.join(__dirname, 'screenshots');
const BASE = 'http://127.0.0.1:8765/';

const MOBILE  = { width: 390, height: 844 };
const DESKTOP = { width: 1280, height: 900 };
const THEME   = 'dark';

async function shot(page, name) {
  const file = path.join(OUT, name);
  // Viewport-only: la scena è position:fixed/inset:0 → non ha altezza intera
  await page.screenshot({ path: file, fullPage: false });
  console.log('SAVED', file);
}

async function waitAppReady(page) {
  await page.waitForFunction(() => {
    const v = document.getElementById('view');
    return !!v && v.children.length > 0;
  }, { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(400);
}

async function seedRest(page, { leftSec = 45, totalSec = 90 } = {}) {
  await page.evaluate(async () => {
    await new Promise((res) => {
      const r = indexedDB.deleteDatabase('fit-circuit-tracker-v18-optional-day');
      r.onsuccess = res; r.onerror = res; r.onblocked = res;
    });
  });
  await page.reload({ waitUntil: 'load' });
  await waitAppReady(page);

  await page.evaluate(async ({ leftSec, totalSec }) => {
    try { localStorage.setItem('user.name', 'Marco'); } catch(_) {}
    if (typeof resetAndLoad === 'function') { await resetAndLoad(); }
    if (!S.user) S.user = { name: '' };
    S.user.name = 'Marco';

    const c = S.cards[0]; const w = c && c.weeks[0]; const d = w && w.days[0];
    if (!(c && w && d)) return;

    // Tre esercizi mappati → badge automatici (category + equipment).
    const benchId = 'demo-bench-' + Date.now();
    const squatId = 'demo-squat-' + Date.now();
    const rowId   = 'demo-row-'   + Date.now();
    S.exercises.push(
      { id: benchId, name: 'Bench Press', primary: 'Pettorale · Tricipite',
        primaryMuscles: ['chest'], secondaryMuscles: ['triceps','front-delts'],
        source: 'demo', createdAt: now(), updatedAt: now() },
      { id: squatId, name: 'Squat',       primary: 'Quadricipite · Glutei',
        primaryMuscles: ['quads'], secondaryMuscles: ['glutes','hamstrings'],
        source: 'demo', createdAt: now(), updatedAt: now() },
      { id: rowId,   name: 'Barbell Row', primary: 'Dorso · Bicipite',
        primaryMuscles: ['upper-back'], secondaryMuscles: ['lats','biceps'],
        source: 'demo', createdAt: now(), updatedAt: now() },
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
    // Sessione partita 22 minuti fa (per un session-timer credibile).
    if (S.active) S.active.startedAt = new Date(Date.now() - 22*60*1000).toISOString();

    // Log del primo giro completato interamente (per farci "1 giro fatto").
    [benchId, squatId, rowId].forEach((id, i) => {
      const l = logFor(circuitBlock.id, id, 1, true);
      l.kg = [42, 60, 45][i]; l.reps = '12'; l.done = true; l.updatedAt = now();
    });
    // Il focus è già avanzato al secondo giro (come sarebbe dopo close-round).
    S.focus = { on: true, blockIdx: 0, round: 2 };
    S.tab = 'workout';
    persistActive(true);

    // Avvio il rest timer con label reale ("Full Body Circuit • G1")
    // e forzo lo stato (startedAt/end) per un tempo residuo prevedibile.
    if (typeof startRestTimer === 'function') {
      startRestTimer(totalSec, 'Full Body Circuit • G1');
      if (S.timer) {
        S.timer.startedAt = Date.now() - (totalSec - leftSec) * 1000;
        S.timer.end       = Date.now() + leftSec * 1000;
        S.timer.totalSec  = totalSec;
      }
    }
    render();
  }, { leftSec, totalSec });

  // Lascia partire animazioni di intro (halo + slide-up)
  await page.waitForTimeout(700);
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
  await seedRest(page, opts);
  await shot(page, filename);
  await browser.close();
}

console.log('→ rest v2 mobile');
await run(MOBILE,  'sprint92-rest-mobile.png',  { leftSec: 42, totalSec: 90 });
console.log('→ rest v2 desktop');
await run(DESKTOP, 'sprint92-rest-desktop.png', { leftSec: 42, totalSec: 90 });
console.log('→ rest v2 mobile — ultimi 6 secondi');
await run(MOBILE,  'sprint92-rest-ending-mobile.png',  { leftSec: 6, totalSec: 90 });
console.log('done');
