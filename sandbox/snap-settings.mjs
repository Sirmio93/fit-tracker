// Screenshot helper — Settings screen (tab 'profilo', funzione data()) baseline
// per Sprint 9.7. Il piano chiama la schermata "Settings" ma nel codice è la
// tab Profilo (vedi DOCS/09_PROFILE_SETTINGS.md).
//
// Stati catturati per viewport:
//   1) settings-main       — utente con dati, nessuna sessione attiva
//   2) settings-active     — utente con sessione Draft attiva (banner + session card)
//   3) settings-empty      — nessuna sessione mai fatta, nome default "Atleta"
//   4) settings-namedialog — dialog "Modifica nome" aperto sopra main
//
// Uso:  node sandbox/snap-settings.mjs [--suffix baseline|post]
// Requisito: server locale su http://127.0.0.1:8765/ (es. `python -m http.server 8765`
//            oppure `npx http-server -p 8765`) avviato dalla root del progetto.
//
// NOTE: audit tooling. Nessuna modifica a codice/runtime/UI/Foundation/router/state/logic.
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

async function wipeDb(page) {
  await page.evaluate(async () => {
    await new Promise((res) => {
      const r = indexedDB.deleteDatabase('fit-circuit-tracker-v18-optional-day');
      r.onsuccess = res; r.onerror = res; r.onblocked = res;
    });
    try { localStorage.removeItem('user.name'); } catch(_) {}
    try { localStorage.removeItem('prefs'); } catch(_) {}
    try { localStorage.removeItem('user.installedAt'); } catch(_) {}
    try { localStorage.removeItem('user.namePrefilledAt'); } catch(_) {}
  });
  await page.reload({ waitUntil: 'load' });
  await waitAppReady(page);
}

// Seed: scheda importata + 4 sessioni completate + nome custom.
async function seedSettingsMain(page) {
  await page.evaluate(async () => {
    try { localStorage.setItem('user.name', 'Marco'); } catch(_) {}
    // Backdate installedAt by 12 days for realistic "Giorni con l'app" KPI.
    const twelveDaysAgo = new Date(Date.now() - 12 * 24 * 3600e3).toISOString();
    try { localStorage.setItem('user.installedAt', twelveDaysAgo); } catch(_) {}
    if (typeof resetAndLoad === 'function') { await resetAndLoad(); }
    if (!S.user) S.user = { name: '' };
    S.user.name = 'Marco';
    const c = S.cards[0]; const w = c && c.weeks[0]; const d = w && w.days[0];
    if (!(c && w && d)) return;
    const DAY = 24 * 3600e3;
    const today = new Date(); today.setHours(9, 0, 0, 0);
    // 4 completed sessions across 12 days → KPI: 4 workout · 12 giorni · Oggi
    const scenarios = [
      { offset: 11, kg: 30, reps: '12', durMin: 42 },
      { offset:  8, kg: 32, reps: '12', durMin: 45 },
      { offset:  4, kg: 34, reps: '10', durMin: 48 },
      { offset:  0, kg: 36, reps: '10', durMin: 50 },
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
    S.tab = 'profilo';
    render();
  });
  await page.waitForTimeout(400);
}

// Seed: main + sessione Draft attiva (nessun set completato) → banner + session card.
async function seedSettingsActive(page) {
  await seedSettingsMain(page);
  await page.evaluate(async () => {
    const c = S.cards[0]; const w = c && c.weeks[0]; const d = w && w.days[0];
    if (!(c && w && d)) return;
    S.active = {
      id: 'active-draft-1',
      cardId: c.id, weekKey: w.key, dayKey: d.key,
      startedAt: null,
      endedAt: null,
      exerciseLogs: [],
    };
    if (typeof persistActive === 'function') { try { await persistActive(true); } catch(_) {} }
    S.tab = 'profilo';
    render();
  });
  await page.waitForTimeout(400);
}

// Seed: empty — nessuna sessione, nessuna scheda, nome default "Atleta".
async function seedSettingsEmpty(page) {
  await page.evaluate(async () => {
    try { localStorage.removeItem('user.name'); } catch(_) {}
    if (!S.user) S.user = { name: '' };
    S.user.name = '';
    S.sessions = [];
    S.active = null;
    S.tab = 'profilo';
    render();
  });
  await page.waitForTimeout(300);
}

async function openNameDialog(page) {
  await page.evaluate(() => {
    if (typeof profileEditName === 'function') profileEditName();
  });
  await page.waitForTimeout(400);
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
  }, THEME);
  await page.reload({ waitUntil: 'load' });
  await waitAppReady(page);

  const tag = viewport.name;

  // 1) settings-main — populated, no active session
  await wipeDb(page);
  await seedSettingsMain(page);
  await shot(page, `settings-main-${tag}-${SUFFIX}.png`);

  // 2) settings-active — populated + Draft session
  await wipeDb(page);
  await seedSettingsActive(page);
  await shot(page, `settings-active-${tag}-${SUFFIX}.png`);

  // 3) settings-empty — no data, default name
  await wipeDb(page);
  await seedSettingsEmpty(page);
  await shot(page, `settings-empty-${tag}-${SUFFIX}.png`);

  // 4) settings-namedialog — main + name dialog open
  await wipeDb(page);
  await seedSettingsMain(page);
  await openNameDialog(page);
  await shot(page, `settings-namedialog-${tag}-${SUFFIX}.png`);

  await browser.close();
}

for (const v of VIEWPORTS) {
  console.log(`→ settings ${v.name} (${v.width}×${v.height}) [${SUFFIX}]`);
  await run({ width: v.width, height: v.height, name: v.name });
}
console.log('done');
