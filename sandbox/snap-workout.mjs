// Screenshot helper — Workout screen Phase 2 (Sprint 9.4 pixel-perfect sweep).
// Apre l'app, seeda una sessione ATTIVA con focus su blocco single,
// forza round=2 per riprodurre il mockup ("Round 2 di 3") e cattura
// screenshot su 7 viewport standard, in dark mode.
// Uso:  node sandbox/snap-workout.mjs [--suffix pre|post]
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, 'screenshots');
const BASE = 'http://127.0.0.1:8765/';

// Sprint 9.4.1 — matrice completa (mobile / tablet / desktop + landscape).
// Mobile: 320×568 (iPhone SE 1), 320×640 (Android low-end),
//         360×640 (mid-Android), 375×667 (iPhone SE 2/3), 390×844 (iPhone 15),
//         414×896 (iPhone XR/11).
// Tablet: 768×1024, 820×1180.
// Desktop: 1024×768, 1280×900, 1440×900.
// Landscape mobile (P2): 667×375, 844×390.
const VIEWPORTS = [
  { name: 'm320x568',  width: 320,  height: 568  },
  { name: 'm320x640',  width: 320,  height: 640  },
  { name: 'm360x640',  width: 360,  height: 640  },
  { name: 'm375x667',  width: 375,  height: 667  },
  { name: 'm390x844',  width: 390,  height: 844  },
  { name: 'm414x896',  width: 414,  height: 896  },
  { name: 't768x1024', width: 768,  height: 1024 },
  { name: 't820x1180', width: 820,  height: 1180 },
  { name: 'd1024x768', width: 1024, height: 768  },
  { name: 'd1280x900', width: 1280, height: 900  },
  { name: 'd1440x900', width: 1440, height: 900  },
  { name: 'L667x375',  width: 667,  height: 375  },
  { name: 'L844x390',  width: 844,  height: 390  },
];
const THEME = 'dark';

// Parse suffix arg: default "pre" per baseline pre-modifiche.
function parseSuffix() {
  const argv = process.argv.slice(2);
  const i = argv.indexOf('--suffix');
  if (i >= 0 && argv[i + 1]) return String(argv[i + 1]).replace(/[^a-z0-9\-]/gi, '');
  return 'pre';
}
const SUFFIX = parseSuffix();

async function shot(page, name) {
  const file = path.join(OUT, name);
  await page.screenshot({ path: file, fullPage: true });
  console.log('SAVED', file);
}

// Sprint 9.4.1 — audit runtime dell'overflow orizzontale: se qualunque nodo
// dentro .c-workoutSceneV2 sfora la larghezza del container, viene stampato
// nel log ({tag,class,rect}). Zero righe = viewport pulito.
async function auditOverflow(page, viewportName) {
  const report = await page.evaluate(() => {
    const scene = document.querySelector('.c-workoutSceneV2');
    if (!scene) return { hasScene: false, docScroll: 0, offenders: [] };
    const sceneRect = scene.getBoundingClientRect();
    const offenders = [];
    scene.querySelectorAll('*').forEach((el) => {
      const r = el.getBoundingClientRect();
      // Salta i nodi non renderizzati: visually-hidden (position:absolute
      // 1×1), display:none (0×0), o container collassati. Non sono overflow.
      if (r.width < 2 || r.height < 2) return;
      const overflowRight = r.right - sceneRect.right;
      const overflowLeft  = sceneRect.left - r.left;
      if (overflowRight > 0.5 || overflowLeft > 0.5) {
        offenders.push({
          tag: el.tagName.toLowerCase(),
          class: (el.className || '').toString().slice(0, 80),
          right: Math.round(overflowRight),
          left:  Math.round(overflowLeft),
          w:     Math.round(r.width),
        });
      }
    });
    return {
      hasScene: true,
      docScroll: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      offenders: offenders.slice(0, 12),
    };
  });
  if (!report.hasScene) {
    console.log(`  AUDIT[${viewportName}] scene not mounted`);
    return;
  }
  if (report.docScroll > 0) console.log(`  AUDIT[${viewportName}] horizontal scroll = ${report.docScroll}px`);
  if (report.offenders.length) {
    console.log(`  AUDIT[${viewportName}] OVERFLOW nodes:`);
    for (const o of report.offenders) console.log('   ', JSON.stringify(o));
  } else {
    console.log(`  AUDIT[${viewportName}] OK — no overflow`);
  }
}

async function waitAppReady(page) {
  await page.waitForFunction(() => {
    const v = document.getElementById('view');
    return !!v && v.children.length > 0;
  }, { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(400);
}

async function seedWorkoutFocus(page) {
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

    // Inietta un esercizio + blocco single-exercise "Chest Press" all'inizio
    // della giornata per riprodurre il layout del mockup Phase 2 anche quando
    // la scheda embedded è tutta a circuito. Persistente solo nella sessione.
    const chestPressExId = 'demo-bench-press-' + Date.now();
    S.exercises.push({
      id: chestPressExId,
      name: 'Chest Press',
      subtitle: 'Panca orizzontale',
      primary: 'Pettorale · Tricipite · Deltoide ant.',
      primaryMuscles:   ['chest'],
      secondaryMuscles: ['triceps', 'front-delts'],
      source: 'demo',
      createdAt: now(), updatedAt: now(),
    });
    const singleBlock = {
      id: 'demo-block-bench-' + Date.now(),
      type: 'single',
      label: 'Chest Press',
      rounds: 3,
      restSec: 60,
      exerciseIds: [chestPressExId],
      exerciseTargets: { [chestPressExId]: { reps: '12-15' } },
    };
    d.blocks.unshift(singleBlock);
    await Store.put('cards', c);

    // Sessione storica completata (ieri) con Chest Press 32 kg × 12 →
    // alimenta lastExerciseLog() così la riga "Ultima volta 32 kg × 12 rip"
    // compare come nel mockup. Non è fake data: è dato reale della sessione
    // precedente iniettato dal seed.
    const yesterday = new Date(Date.now() - 24*60*60*1000).toISOString();
    const histSessionId = 'demo-hist-' + Date.now();
    S.sessions.push({
      id: histSessionId,
      cardId: c.id, weekKey: w.key, dayKey: d.key,
      startedAt: yesterday, endedAt: yesterday,
      exerciseLogs: [
        { blockId: singleBlock.id, exerciseId: chestPressExId, setNo: 1, kg: 32, reps: '12', done: true },
      ],
    });
    await Store.put('sessions', S.sessions[S.sessions.length - 1]);

    await startDay(c.id, w.key, d.key);
    beginWorkout();
    if (S.active) S.active.startedAt = new Date(Date.now() - 32*60*1000).toISOString();
    // Marca la prima serie del chest press come completa: si posiziona su Round 2/3.
    const l1 = logFor(singleBlock.id, chestPressExId, 1, true);
    l1.kg = 32; l1.reps = '12'; l1.done = true; l1.updatedAt = now();
    // Set attivo (2) con valori preimpostati per matching mockup: 34 kg × 12
    const l2 = logFor(singleBlock.id, chestPressExId, 2, true);
    l2.kg = 34; l2.reps = '12'; l2.done = false; l2.updatedAt = now();
    S.focus = { on: true, blockIdx: 0, round: 2 };
    S.tab = 'workout';
    persistActive(true);
    render();
  });
  await page.waitForTimeout(500);
}

async function run(viewport, filename) {
  const browser = await chromium.launch({ channel: 'chrome' });
  const context = await browser.newContext({ viewport, deviceScaleFactor: 2, colorScheme: 'dark' });
  const page = await context.newPage();
  page.on('pageerror', (err) => console.log('PAGE ERROR:', err.message));
  page.on('console', (msg) => { if (msg.type() === 'error') console.log('CONSOLE ERROR:', msg.text()); });

  await page.goto(BASE, { waitUntil: 'load' });
  await page.evaluate((theme) => {
    try { localStorage.setItem('theme', theme); } catch(_){}
    try { localStorage.setItem('user.name', 'Marco'); } catch(_){}
    try { localStorage.setItem('workout.swipeHint.dismissed', '0'); } catch(_){}
  }, THEME);
  await page.reload({ waitUntil: 'load' });
  await waitAppReady(page);
  await seedWorkoutFocus(page);
  await auditOverflow(page, filename);
  await shot(page, filename);
  await browser.close();
}

for (const v of VIEWPORTS) {
  const filename = `phase2-workout-${v.name}-${SUFFIX}.png`;
  console.log(`→ workout ${v.name} (${v.width}×${v.height}) [${SUFFIX}]`);
  await run({ width: v.width, height: v.height }, filename);
}
console.log('done');
