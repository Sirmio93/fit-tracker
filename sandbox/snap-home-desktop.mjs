// Sprint 9.3 — desktop screenshot Home v10.
// Riusa la stessa logica di snap-home.mjs ma con viewport desktop 1440x900.
// Cattura solo lo stato "active" (con sessione seedata) — quello dove il
// layout desktop è più significativo (Recent Activity presente).
// Uso: node sandbox/snap-home-desktop.mjs
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, 'screenshots');
const BASE = 'http://127.0.0.1:8765/';

const VIEWPORT = { width: 1440, height: 900 };
const THEME = 'dark';

async function shot(page, name) {
  const file = path.join(OUT, name);
  await page.screenshot({ path: file, fullPage: true });
  console.log('SAVED', file);
}

async function waitAppReady(page) {
  await page.waitForFunction(() => {
    const v = document.getElementById('view');
    return !!v && v.children.length > 0;
  }, { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(400);
}

async function seedActiveSession(page) {
  await page.evaluate(async () => {
    await new Promise((res) => { const r = indexedDB.deleteDatabase('fit-circuit-tracker-v18-optional-day'); r.onsuccess = res; r.onerror = res; r.onblocked = res; });
  });
  await page.reload({ waitUntil: 'load' });
  await waitAppReady(page);
  await page.evaluate(async () => {
    try { localStorage.setItem('user.name', 'Marco'); } catch(_) {}
    if (typeof resetAndLoad === 'function') { await resetAndLoad(); }
    if (!S.user) S.user = { name: '' };
    S.user.name = 'Marco';
    const c = S.cards[0]; const w = c && c.weeks[0]; const d = w && w.days[0];
    if (c && w && d) {
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

      await startDay(c.id, w.key, d.key);
      beginWorkout();
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
const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1, colorScheme: 'dark' });
const page = await context.newPage();

page.on('pageerror', (err) => console.log('PAGE ERROR:', err.message));
page.on('console', (msg) => { if (msg.type() === 'error') console.log('CONSOLE ERROR:', msg.text()); });

console.log('→ desktop empty state');
await page.goto(BASE, { waitUntil: 'load' });
await page.evaluate((theme) => {
  try { localStorage.setItem('theme', theme); } catch(_){}
  try { localStorage.setItem('user.name', 'Marco'); } catch(_){}
}, THEME);
await page.reload({ waitUntil: 'load' });
await waitAppReady(page);
await page.evaluate(() => { if (!S.user) S.user = { name: '' }; S.user.name = 'Marco'; if (typeof render === 'function') render(); });
await page.waitForTimeout(200);
await shot(page, '03-home-desktop-empty.png');

console.log('→ desktop active session');
await seedActiveSession(page);
await shot(page, '04-home-desktop-active.png');

await browser.close();
console.log('done');
