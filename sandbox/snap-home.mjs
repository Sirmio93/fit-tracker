// Screenshot helper — apre l'app in Chromium a viewport mobile e
// salva PNG della Home in due stati: (1) empty (nessuna scheda),
// (2) con sessione in corso seedata via IndexedDB.
// Uso: node sandbox/snap-home.mjs
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, 'screenshots');
const BASE = 'http://127.0.0.1:8765/';

const VIEWPORT = { width: 390, height: 844 }; // iPhone 14
const THEME = 'dark';

async function shot(page, name) {
  const file = path.join(OUT, name);
  await page.screenshot({ path: file, fullPage: true });
  console.log('SAVED', file);
}

async function waitAppReady(page) {
  // aspetta che #view abbia qualche child o che passi 3s
  await page.waitForFunction(() => {
    const v = document.getElementById('view');
    return !!v && v.children.length > 0;
  }, { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(400);
}

async function seedActiveSession(page) {
  // Applica una scheda minima e una S.active in memoria, poi rirenderizza.
  await page.evaluate(async () => {
    // pulisci indexeddb
    await new Promise((res) => { const r = indexedDB.deleteDatabase('fit-circuit-tracker-v18-optional-day'); r.onsuccess = res; r.onerror = res; r.onblocked = res; });
  });
  await page.reload({ waitUntil: 'load' });
  await waitAppReady(page);
  // salva nome utente + importa piano embedded + seed sessione precedente + attiva sessione corrente
  await page.evaluate(async () => {
    try { localStorage.setItem('user.name', 'Marco'); } catch(_) {}
    if (typeof resetAndLoad === 'function') { await resetAndLoad(); }
    if (!S.user) S.user = { name: '' };
    S.user.name = 'Marco';
    const c = S.cards[0]; const w = c && c.weeks[0]; const d = w && w.days[0];
    if (c && w && d) {
      // 1) Sessione COMPLETATA precedente (per la card "Ultimo workout")
      const previousSession = {
        id: 'seed-prev-1',
        cardId: c.id, weekKey: w.key, dayKey: d.key,
        startedAt: new Date(Date.now() - 3*24*60*60*1000).toISOString(),
        endedAt:   new Date(Date.now() - 3*24*60*60*1000 + 47*60*1000).toISOString(),
        exerciseLogs: (() => {
          const logs = [];
          for (const b of d.blocks) {
            const rounds = +b.rounds || 3;
            for (let s = 1; s <= rounds; s++) {
              for (const id of b.exerciseIds) {
                logs.push({ blockId: b.id, exerciseId: id, setIndex: s, kg: 40, reps: '12', done: true, updatedAt: new Date().toISOString() });
              }
            }
          }
          return logs;
        })(),
      };
      if (!S.sessions) S.sessions = [];
      S.sessions.push(previousSession);
      if (typeof Store !== 'undefined' && Store.put) { try { await Store.put('sessions', previousSession); } catch(_) {} }

      // 2) Sessione CORRENTE in corso (con startedAt reale)
      await startDay(c.id, w.key, d.key);
      beginWorkout();
      // Fissa startedAt 32 minuti fa per mostrare Durata realistica
      if (S.active) S.active.startedAt = new Date(Date.now() - 32*60*1000).toISOString();
      const blocks = ctx().blocks;
      const total = blocks.reduce((n,b)=>n+b.exerciseIds.length*(+b.rounds||3),0);
      const target = Math.round(total * 0.43);
      let done = 0;
      for (const b of blocks) {
        const rounds = +b.rounds || 3;
        for (let s=1; s<=rounds && done<target; s++) {
          for (const id of b.exerciseIds) {
            if (done>=target) break;
            const l = logFor(b.id, id, s, true);
            l.kg = 34; l.reps = '12'; l.done = true; l.updatedAt = now();
            done++;
          }
        }
      }
      persistActive(true);
      S.tab = 'home';
      render();
    }
  });
  await page.waitForTimeout(500);
}

const browser = await chromium.launch({ channel: 'chrome' });
const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2, colorScheme: 'dark' });
const page = await context.newPage();

page.on('pageerror', (err) => console.log('PAGE ERROR:', err.message));
page.on('console', (msg) => { if (msg.type() === 'error') console.log('CONSOLE ERROR:', msg.text()); });

console.log('→ empty state');
await page.goto(BASE, { waitUntil: 'load' });
await page.evaluate((theme) => {
  try { localStorage.setItem('theme', theme); } catch(_){}
  try { localStorage.setItem('user.name', 'Marco'); } catch(_){}
}, THEME);
await page.reload({ waitUntil: 'load' });
await waitAppReady(page);
await page.evaluate(() => { if (!S.user) S.user = { name: '' }; S.user.name = 'Marco'; if (typeof render === 'function') render(); });
await page.waitForTimeout(200);
await shot(page, '01-home-empty.png');

console.log('→ active session');
await seedActiveSession(page);
await shot(page, '02-home-active.png');

await browser.close();
console.log('done');
