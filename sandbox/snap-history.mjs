// Screenshot helper — History overlay baseline (Sprint 9.6 audit deliverable #3).
// Seeds ~8 completed sessions spread across ~2 months (triggers month grouping +
// PR badges), then captures the History overlay in three states across mobile /
// tablet / desktop viewports.
//
// States captured per viewport:
//   1) history-main    — overlay open, timeline populated
//   2) history-detail  — overlay open, first session detail expanded
//   3) history-empty   — overlay open, no sessions (global empty state)
//
// Uso:  node sandbox/snap-history.mjs [--suffix baseline|post]
//
// NOTE: this is audit tooling only. It does not modify production code,
// runtime, UI, Foundation, router, state, or business logic.
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, 'screenshots');
const BASE = 'http://127.0.0.1:8765/';

const VIEWPORTS = [
  { name: 'm390x844',  width: 390,  height: 844  },
  { name: 't768x1024', width: 768,  height: 1024 },
  { name: 'd1440x900', width: 1440, height: 900  },
];
const THEME = 'dark';

function parseSuffix() {
  const argv = process.argv.slice(2);
  const i = argv.indexOf('--suffix');
  if (i >= 0 && argv[i + 1]) return String(argv[i + 1]).replace(/[^a-z0-9\-]/gi, '');
  return 'baseline';
}
const SUFFIX = parseSuffix();

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

async function wipeDb(page) {
  await page.evaluate(async () => {
    await new Promise((res) => {
      const r = indexedDB.deleteDatabase('fit-circuit-tracker-v18-optional-day');
      r.onsuccess = res; r.onerror = res; r.onblocked = res;
    });
  });
  await page.reload({ waitUntil: 'load' });
  await waitAppReady(page);
}

async function seedHistorySessions(page) {
  await page.evaluate(async () => {
    try { localStorage.setItem('user.name', 'Marco'); } catch(_) {}
    if (typeof resetAndLoad === 'function') { await resetAndLoad(); }
    if (!S.user) S.user = { name: '' };
    S.user.name = 'Marco';
    const c = S.cards[0]; const w = c && c.weeks[0]; const d = w && w.days[0];
    if (!(c && w && d)) return;
    const DAY = 24 * 3600e3;
    const today = new Date(); today.setHours(9, 0, 0, 0);
    // 8 sessions across ~55 days to exercise 2+ month buckets and 3+ PRs.
    const scenarios = [
      { offset: 55, kg: 30, reps: '12', durMin: 40 },
      { offset: 40, kg: 32, reps: '12', durMin: 42 },
      { offset: 27, kg: 34, reps: '12', durMin: 45 },
      { offset: 20, kg: 36, reps: '12', durMin: 48 },
      { offset: 15, kg: 38, reps: '10', durMin: 50 },
      { offset:  9, kg: 40, reps: '10', durMin: 52 },
      { offset:  5, kg: 41, reps: '10', durMin: 55 },
      { offset:  2, kg: 42, reps:  '8', durMin: 58 },
    ];
    for (const sc of scenarios) {
      const started = new Date(today.getTime() - sc.offset * DAY);
      const ended   = new Date(started.getTime() + sc.durMin * 60e3);
      const sess = {
        id: 'seed-' + sc.offset,
        cardId: c.id, weekKey: w.key, dayKey: d.key,
        startedAt: started.toISOString(),
        endedAt:   ended.toISOString(),
        durationSec: sc.durMin * 60,
        exerciseLogs: [],
      };
      for (const b of d.blocks) {
        const rounds = +b.rounds || 3;
        for (let s = 1; s <= rounds; s++) {
          for (const id of b.exerciseIds) {
            sess.exerciseLogs.push({
              blockId: b.id, exerciseId: id, setNo: s,
              kg: sc.kg, reps: sc.reps, done: true,
              updatedAt: sess.endedAt,
            });
          }
        }
      }
      S.sessions.push(sess);
      try { await Store.put('sessions', sess); } catch(_) {}
    }
    S.tab = 'progressi';
    S.progress = S.progress || {};
    S.progress.view = 'storico';
    S.progress.period = 'all';
    render();
  });
  await page.waitForTimeout(400);
}

async function seedEmpty(page) {
  await page.evaluate(async () => {
    try { localStorage.setItem('user.name', 'Marco'); } catch(_) {}
    if (typeof resetAndLoad === 'function') { await resetAndLoad(); }
    if (!S.user) S.user = { name: '' };
    S.user.name = 'Marco';
    S.sessions = [];
    S.tab = 'progressi';
    S.progress = S.progress || {};
    S.progress.view = 'storico';
    S.progress.period = 'all';
    render();
  });
  await page.waitForTimeout(300);
}

async function openHistoryOverlay(page) {
  await page.evaluate(() => {
    if (typeof historyOpen === 'function') historyOpen();
  });
  // Overlay slide-in transition is 240 ms; add buffer for backdrop-filter paint.
  await page.waitForTimeout(600);
}

async function openFirstHistoryCard(page) {
  await page.evaluate(() => {
    const card = document.querySelector('.historyOverlay .historyCard');
    if (card) card.click();
  });
  await page.waitForTimeout(500);
}

async function run(viewport) {
  const browser = await chromium.launch({ channel: 'chrome' });
  const context = await browser.newContext({ viewport, deviceScaleFactor: 2, colorScheme: 'dark' });
  const page = await context.newPage();
  page.on('pageerror', (err) => console.log('PAGE ERROR:', err.message));
  page.on('console', (msg) => { if (msg.type() === 'error') console.log('CONSOLE ERROR:', msg.text()); });

  await page.goto(BASE, { waitUntil: 'load' });
  await page.evaluate((theme) => {
    try { localStorage.setItem('theme', theme); } catch(_){}
    try { localStorage.setItem('user.name', 'Marco'); } catch(_){}
  }, THEME);
  await page.reload({ waitUntil: 'load' });
  await waitAppReady(page);

  const tag = viewport.name;

  // 1) History main — overlay open, timeline populated
  await wipeDb(page);
  await seedHistorySessions(page);
  await openHistoryOverlay(page);
  await shot(page, `history-main-${tag}-${SUFFIX}.png`);

  // 2) History detail — click first card in the overlay
  await openFirstHistoryCard(page);
  await shot(page, `history-detail-${tag}-${SUFFIX}.png`);

  // 3) History empty — overlay open, no sessions (global empty state)
  await wipeDb(page);
  await seedEmpty(page);
  await openHistoryOverlay(page);
  await shot(page, `history-empty-${tag}-${SUFFIX}.png`);

  await browser.close();
}

for (const v of VIEWPORTS) {
  console.log(`→ history ${v.name} (${v.width}×${v.height}) [${SUFFIX}]`);
  await run({ width: v.width, height: v.height, name: v.name });
}
console.log('done');
