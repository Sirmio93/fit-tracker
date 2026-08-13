// Screenshot helper — Sprint 9.1A Unified Session Header.
// Copre le tre modalità del componente unificato + resilienza a:
//   · notch iOS (safe-area-inset-top emulato via CSS env fallback)
//   · gesture-nav Android (safe-area-inset-left/right emulato)
//   · orientamento landscape
//
// Stati catturati per viewport mobile-dark:
//   1) sticky-expanded          (scrollY=0, blocco multi-esercizio in focus)
//   2) sticky-morphing          (--collapse=0.5 forzato)
//   3) sticky-compact           (--collapse=1  forzato, mostra "Round X/Y")
//   4) immersive                (blocco single-focus → variante piatta)
//   5) landscape                (viewport ruotato, sticky-expanded)
//   6) safeArea                 (safe-inset simulato 44/16/16, compact)
//
// Uso: node sandbox/snap-sticky-header.mjs
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT  = path.join(__dirname, 'screenshots');
const BASE = 'http://127.0.0.1:8765/';

const MOBILE           = { width: 390, height: 844 };
const MOBILE_LANDSCAPE = { width: 844, height: 390 };
const DESKTOP          = { width: 1280, height: 900 };

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

// Seeds attive: focusMulti = blocco multi-esercizio (sticky header).
// focusSingle = blocco single-exercise (variante immersive).
async function seed(page, kind) {
  await page.evaluate(async () => {
    await new Promise((res) => {
      const r = indexedDB.deleteDatabase('fit-circuit-tracker-v18-optional-day');
      r.onsuccess = res; r.onerror = res; r.onblocked = res;
    });
  });
  await page.reload({ waitUntil: 'load' });
  await waitAppReady(page);

  await page.evaluate(async (kind) => {
    try { localStorage.setItem('user.name', 'Marco'); } catch(_) {}
    if (typeof resetAndLoad === 'function') { await resetAndLoad(); }
    // Trova la coppia (card, week, day) che contiene almeno un blocco del tipo
    // richiesto (single ↔ non-single). Se `single`, deve avere anche un
    // Single-block per far cadere l'app sul path immersive.
    const wantSingle = kind === 'single';
    let target = null;
    for (const c of S.cards) {
      for (const w of c.weeks) {
        for (const d of w.days) {
          const hasSingle = d.blocks.some(b => String(b.type).toLowerCase() === 'single');
          const hasMulti  = d.blocks.some(b => String(b.type).toLowerCase() !== 'single');
          if (wantSingle && hasSingle) { target = { c, w, d }; break; }
          if (!wantSingle && hasMulti && !target) { target = { c, w, d }; }
        }
        if (target && wantSingle) break;
      }
      if (target && wantSingle) break;
    }
    if (!target) return;
    const { c, w, d } = target;
    await startDay(c.id, w.key, d.key);
    let idx;
    if (wantSingle) {
      idx = d.blocks.findIndex(b => String(b.type).toLowerCase() === 'single');
      if (idx < 0) idx = 0;
    } else {
      idx = d.blocks.findIndex(b => String(b.type).toLowerCase() !== 'single');
      if (idx < 0) idx = 0;
    }
    S.focus = { on: true, blockIdx: idx, round: 1 };
    S.tab = 'workout';
    persistActive(true);
    render();
  }, kind);
  await page.waitForTimeout(500);
}

async function withTheme(page, theme) {
  await page.goto(BASE, { waitUntil: 'load' });
  await page.evaluate((t) => {
    try { localStorage.setItem('theme', t); } catch(_){}
    try { localStorage.setItem('user.name', 'Marco'); } catch(_){}
  }, theme);
  await page.reload({ waitUntil: 'load' });
  await waitAppReady(page);
}

async function run(viewport, prefix, theme = 'dark', opts = {}) {
  const browser = await chromium.launch({ channel: 'chrome' });
  const context = await browser.newContext({ viewport, deviceScaleFactor: 2, colorScheme: theme });
  const page = await context.newPage();
  page.on('pageerror', (err) => console.log('PAGE ERROR:', err.message));
  page.on('console', (msg) => { if (msg.type() === 'error') console.log('CONSOLE ERROR:', msg.text()); });

  await withTheme(page, theme);
  await seed(page, 'multi');

  // 1) Expanded
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  await shot(page, `${prefix}-expanded.png`);

  // 2) Morphing (--collapse=0.5)
  await page.evaluate(() => {
    const h = document.querySelector('#view .c-wsh');
    if (h) h.style.setProperty('--collapse', '0.5');
  });
  await page.waitForTimeout(300);
  await shot(page, `${prefix}-morphing.png`);

  // 3) Compact (--collapse=1, mostra Round X/Y — mai il nome del giorno)
  await page.evaluate(() => {
    const h = document.querySelector('#view .c-wsh');
    if (h) { h.style.setProperty('--collapse', '1'); h.dataset.collapsed = '1'; }
  });
  await page.waitForTimeout(300);
  await shot(page, `${prefix}-compact.png`);

  // 4) Immersive — blocco single-focus → WorkoutStickyHeader({mode:'immersive'})
  if (opts.captureImmersive !== false) {
    await seed(page, 'single');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);
    await shot(page, `${prefix}-immersive.png`);
  }

  await browser.close();
}

// Landscape + safe-area combinato (mobile ruotato + safe insets simulati).
async function runLandscape() {
  const browser = await chromium.launch({ channel: 'chrome' });
  const context = await browser.newContext({
    viewport: MOBILE_LANDSCAPE,
    deviceScaleFactor: 2,
    colorScheme: 'dark',
  });
  const page = await context.newPage();
  await withTheme(page, 'dark');
  await seed(page, 'multi');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  await shot(page, 'sticky-header-landscape-expanded.png');

  // Compact landscape
  await page.evaluate(() => {
    const h = document.querySelector('#view .c-wsh');
    if (h) { h.style.setProperty('--collapse', '1'); h.dataset.collapsed = '1'; }
  });
  await page.waitForTimeout(300);
  await shot(page, 'sticky-header-landscape-compact.png');

  await browser.close();
}

// Safe-area probe. Playwright non emula davvero env(safe-area-inset-*) —
// iniettiamo variabili fallback direttamente sul :root del componente
// per verificare che il padding max(pad, safe) e il padding-top col notch
// producano la spaziatura attesa (44px top + 20px sides).
async function runSafeArea() {
  const browser = await chromium.launch({ channel: 'chrome' });
  const context = await browser.newContext({
    viewport: MOBILE,
    deviceScaleFactor: 2,
    colorScheme: 'dark',
  });
  const page = await context.newPage();
  await withTheme(page, 'dark');
  await seed(page, 'multi');
  await page.evaluate(() => {
    const h = document.querySelector('#view .c-wsh');
    if (!h) return;
    // Simula iPhone-notch (44px top, 34px bottom, 0 lati portrait)
    // + gesture-nav Android in landscape (16px left/right)
    h.style.setProperty('--wsh-safe-top', '44px');
    h.style.setProperty('--wsh-safe-left', '20px');
    h.style.setProperty('--wsh-safe-right', '20px');
  });
  await page.waitForTimeout(300);
  await shot(page, 'sticky-header-safeArea-expanded.png');

  // Compact con safe-area
  await page.evaluate(() => {
    const h = document.querySelector('#view .c-wsh');
    if (h) { h.style.setProperty('--collapse', '1'); h.dataset.collapsed = '1'; }
  });
  await page.waitForTimeout(300);
  await shot(page, 'sticky-header-safeArea-compact.png');

  await browser.close();
}

console.log('→ sticky-header mobile dark (expanded/morphing/compact/immersive)');
await run(MOBILE,  'sticky-header-mobile-dark',  'dark');
console.log('→ sticky-header mobile light');
await run(MOBILE,  'sticky-header-mobile-light', 'light');
console.log('→ sticky-header desktop dark');
await run(DESKTOP, 'sticky-header-desktop-dark', 'dark', { captureImmersive: false });
console.log('→ sticky-header landscape');
await runLandscape();
console.log('→ sticky-header safe-area probe');
await runSafeArea();
console.log('done');
