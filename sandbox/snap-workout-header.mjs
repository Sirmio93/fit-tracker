// Screenshot helper — Collapsible WorkoutHeader hotfix.
// Apre l'app, seeda una sessione ATTIVA con focus su un CIRCUITO (multi-esercizio)
// così cade sul path che usa UI.WorkoutHeader (non l'immersive scene single).
// Cattura mobile expanded (scrollY=0) e collapsed (scrollY=220).
// Uso: node sandbox/snap-workout-header.mjs
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, 'screenshots');
const BASE = 'http://127.0.0.1:8765/';

const MOBILE  = { width: 390, height: 844 };
const DESKTOP = { width: 1280, height: 900 };

async function shot(page, name) {
  const file = path.join(OUT, name);
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

async function seedWorkoutMulti(page) {
  await page.evaluate(async () => {
    await new Promise((res) => {
      const r = indexedDB.deleteDatabase('fit-circuit-tracker-v18-optional-day');
      r.onsuccess = res; r.onerror = res; r.onblocked = res;
    });
  });
  await page.reload({ waitUntil: 'load' });
  await waitAppReady(page);

  await page.evaluate(async () => {
    try { localStorage.setItem('user.name', 'Marco'); } catch(_) {}
    if (typeof resetAndLoad === 'function') { await resetAndLoad(); }
    const c = S.cards[0]; const w = c && c.weeks[0]; const d = w && w.days[0];
    if (!(c && w && d)) return;
    await startDay(c.id, w.key, d.key);
    // NON chiamiamo beginWorkout(): sessione in bozza per mostrare bottone INIZIO.
    // Focus ON, ma su un blocco NON single: cadiamo sul path WorkoutHeader classico.
    let mi = d.blocks.findIndex(b => String(b.type).toLowerCase() !== 'single');
    if (mi < 0) mi = 0;
    S.focus = { on: true, blockIdx: mi, round: 1 };
    S.tab = 'workout';
    persistActive(true);
    render();
  });
  await page.waitForTimeout(500);
}

async function run(viewport, prefix) {
  const browser = await chromium.launch({ channel: 'chrome' });
  const context = await browser.newContext({ viewport, deviceScaleFactor: 2, colorScheme: 'light' });
  const page = await context.newPage();
  page.on('pageerror', (err) => console.log('PAGE ERROR:', err.message));
  page.on('console', (msg) => { if (msg.type() === 'error') console.log('CONSOLE ERROR:', msg.text()); });

  await page.goto(BASE, { waitUntil: 'load' });
  await page.evaluate(() => {
    try { localStorage.setItem('theme', 'light'); } catch(_){}
    try { localStorage.setItem('user.name', 'Marco'); } catch(_){}
  });
  await page.reload({ waitUntil: 'load' });
  await waitAppReady(page);
  await seedWorkoutMulti(page);

  // Stato 1 — Expanded (scrollY=0)
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  await shot(page, `${prefix}-expanded.png`);

  // Stato 2 — Collapsed (scroll oltre threshold del sentinel)
  await page.evaluate(() => window.scrollTo(0, 260));
  await page.waitForTimeout(350);
  await shot(page, `${prefix}-collapsed.png`);

  await browser.close();
}

console.log('→ header mobile');
await run(MOBILE,  'hotfix-header-mobile');
console.log('→ header desktop');
await run(DESKTOP, 'hotfix-header-desktop');
console.log('done');
