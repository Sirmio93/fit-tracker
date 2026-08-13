// Screenshot helper — Progress screen (stats() router) baseline.
// Seeds ~6 completed sessions across 3 different day templates + 3 PRs on
// a "Panca piana" exercise, then captures the Progress tab on Overview,
// Storico, Record, and Session Detail sub-views. Mobile / tablet / desktop.
// Uso:  node sandbox/snap-progress.mjs [--suffix baseline|post]
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

async function seedProgress(page) {
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
    if (!S.user) S.user = { name: '' };
    S.user.name = 'Marco';
    const c = S.cards[0]; const w = c && c.weeks[0]; const d = w && w.days[0];
    if (!(c && w && d)) return;

    // 6 completed sessions distributed on the last 4 weeks. Volume progression
    // to trigger a positive Insight card. PRs on bench press progression 32->42.
    const HOUR = 3600e3, DAY = 24 * HOUR;
    const today = new Date(); today.setHours(9, 0, 0, 0);
    const scenarios = [
      { offset: 27, kg: 32, reps: '12', durMin: 42 },
      { offset: 20, kg: 34, reps: '12', durMin: 45 },
      { offset: 15, kg: 36, reps: '12', durMin: 48 },
      { offset:  9, kg: 38, reps: '10', durMin: 52 },
      { offset:  5, kg: 40, reps: '10', durMin: 55 },
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
    S.progress.view = 'overview';
    S.progress.period = 'month';
    render();
  });
  await page.waitForTimeout(600);
}

async function goView(page, view) {
  await page.evaluate((v) => {
    if (typeof progressGoView === 'function') progressGoView(v);
  }, view);
  await page.waitForTimeout(400);
}

async function openFirstSession(page) {
  await page.evaluate(() => {
    const btn = document.querySelector('[data-action="open-session-detail"]');
    if (btn) btn.click();
  });
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    const first = document.querySelector('.progressExCard__head');
    if (first) first.click();
  });
  await page.waitForTimeout(300);
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
  await seedProgress(page);

  const tag = viewport.name;
  await shot(page, `progress-overview-${tag}-${SUFFIX}.png`);

  await goView(page, 'storico');
  await shot(page, `progress-storico-${tag}-${SUFFIX}.png`);

  await goView(page, 'record');
  await shot(page, `progress-record-${tag}-${SUFFIX}.png`);

  await goView(page, 'overview');
  await openFirstSession(page);
  await shot(page, `progress-detail-${tag}-${SUFFIX}.png`);

  await browser.close();
}

for (const v of VIEWPORTS) {
  console.log(`→ progress ${v.name} (${v.width}×${v.height}) [${SUFFIX}]`);
  await run({ width: v.width, height: v.height, name: v.name });
}
console.log('done');
