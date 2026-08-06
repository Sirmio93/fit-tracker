# NAVIGATION_REPORT — Step 3

**Versione:** 1.0
**Data:** 2026-08-05
**Scope:** Fase 10 — Step 3 (Navigation shell: top-bar removal + BottomNavigation component)
**Prerequisito:** [FOUNDATION_REPORT.md](FOUNDATION_REPORT.md) + [THEME_REPORT.md](THEME_REPORT.md) completati; `window.UI.BottomNavigation` disponibile via bootstrap.

---

## 0. TL;DR

- **Top-bar rimossa** da [index.html](../index.html): eliminata la barra superiore `.top .brand h1 #themeBtn` (12 righe → 0).
- **BottomNav legacy sostituita** dal componente `UI.BottomNavigation`: 4 tab (🏠 Home · 💪 Workout · 📈 Progressi · 👤 Profilo), stato attivo tramite `is-active` sul component.
- **Rimosso** in [app.js](../app.js): `NAV_ICONS` (11 righe inline SVG), listener `#themeBtn`, render legacy `.navItem` in `render()`.
- **Rinominato** `go('stats')` → `go('progressi')` nel path post-workout (decisione audit §5.3 M2).
- **Business logic INTATTA**: state machine, IndexedDB, `Store`, tutte le funzioni SACRE invariate. `TAB_MIGRATION` conservato per backward-compat con vecchi `localStorage.tab`.
- **Nessuna nuova UI di selezione tema**: rimossa la rotazione `#themeBtn` legacy; il selettore utente arriva in Step 11 Settings. Nel frattempo, il tema resta modificabile via `UI.setTheme(name)` da console (test) o dai preset OS (system).

---

## 1. CHANGESET

| File | Δ | Natura |
|------|---|--------|
| [index.html](../index.html) | -13 / +2 | Rimossa `.top` legacy; sostituito `<nav id="bottomNav">` con `<div id="bottomNavRoot">` |
| [app.js](../app.js) | -18 / +14 | Rimosso `NAV_ICONS` + handler `#themeBtn`; render nav via `UI.BottomNavigation`/`mountBottomNavigation`/`setActiveNavItem`; `go('stats')` → `go('progressi')` |

**File NON toccati:**
- [components/Navigation/BottomNavigation.js](../components/Navigation/BottomNavigation.js) — usato as-is
- [components/Shared/Icon.js](../components/Shared/Icon.js) — glyph `home`, `dumbbell`, `chart`, `user` già presenti
- [components/Navigation/navigation.css](../components/Navigation/navigation.css) — `.c-bottomNav*` già presente
- [components/index.js](../components/index.js), [components/bootstrap.js](../components/bootstrap.js) — invariati
- [styles.css](../styles.css) — invariato (dead code su `.top .brand .bottomNav .navItem #bottomNav` che rimane finché Step 12; nessun impatto visivo)
- [sw.js](../sw.js), [manifest.json](../manifest.json), [components/Foundation/tokens.css](../components/Foundation/tokens.css) — invariati
- IndexedDB, `S`, business logic, tutte le funzioni SACRE — invariate

---

## 2. DETTAGLIO CAMBIAMENTI

### 2.1 index.html — top-bar rimossa, mount BottomNav

**Prima** (righe 14-29):
```html
<div class="app">
    <div class="top">
        <div class="between">
            <div class="brand">
                <div class="logo">FT</div>
                <div>
                    <h1>Fit Circuit Tracker</h1>
                    <p class="sub">Scheda → settimana → giorno → esecuzione</p>
                </div>
            </div><button id="themeBtn" aria-label="Cambia tema chiaro/scuro">Tema</button>
        </div>
    </div>
    <main id="view"></main>
</div>
<nav id="bottomNav" class="bottomNav" aria-label="Navigazione principale"></nav>
```

**Dopo:**
```html
<div class="app">
    <main id="view"></main>
</div>
<div id="bottomNavRoot"></div>
```

**Perché `<div id="bottomNavRoot">` invece di riusare `#bottomNav`:**
- `UI.BottomNavigation()` restituisce già un `<nav class="c-bottomNav" role="navigation">`; injettarlo dentro un `<nav id="bottomNav">` esistente creerebbe `<nav><nav>...</nav></nav>` (semantica sbagliata, doppio landmark).
- Il div funge da mount point neutro; `.c-bottomNav` (già stilizzata come `position: fixed; bottom: 0`) prende il posto della vecchia `.bottomNav`.
- L'id `bottomNavRoot` è nuovo — nessuna collisione con selettori legacy `#bottomNav` in styles.css (che diventano dead code, no-op).

### 2.2 app.js — render() con BottomNavigation component

**Prima** (11 righe di icone SVG + render inline con onclick globale):
```js
const NAV_ICONS = { home: '<svg…>', workout: '<svg…>', progressi: '<svg…>', profilo: '<svg…>' };
function render() {
    applyTheme();
    if (TAB_MIGRATION[S.tab]) S.tab = TAB_MIGRATION[S.tab];
    const nav = [['home', 'Home'], ['workout', 'Workout'], …];
    const bn = document.getElementById('bottomNav');
    if (bn) bn.innerHTML = nav.map(…).join('');
    …
}
```

**Dopo:**
```js
let __bottomNavMounted = false;
function render() {
    applyTheme();
    if (TAB_MIGRATION[S.tab]) S.tab = TAB_MIGRATION[S.tab];
    const bnRoot = document.getElementById('bottomNavRoot');
    if (bnRoot && window.UI && window.UI.BottomNavigation) {
        if (!__bottomNavMounted) {
            bnRoot.innerHTML = window.UI.BottomNavigation({ active: S.tab });
            window.UI.mountBottomNavigation(bnRoot.firstElementChild, function (id) { go(id); });
            __bottomNavMounted = true;
        } else {
            window.UI.setActiveNavItem(bnRoot.firstElementChild, S.tab);
        }
    }
    const screens = { home, workout, progressi: stats, profilo: data };
    $('#view').innerHTML = (screens[S.tab] || home)() + timerDock();
}
```

**Design decisions:**

- **Mount-once + setActiveNavItem** invece di re-render markup ad ogni chiamata: evita listener duplicati (`mountBottomNavigation` aggiunge un `click` listener), riduce reflow, mantiene stato focus/keyboard tra transizioni tab.
- **Guardia `window.UI && window.UI.BottomNavigation`**: se per qualsiasi motivo il module bootstrap non è ancora risolto (edge case teorico — modules e defer eseguono in source order dopo DOM parse, ma la guardia è low-cost), la nav non renderizza invece di crashare.
- **Adattatore onSelect → go(id)**: il component è agnostico; il route dispatch resta unicamente in `go()` (single source of truth per navigazione).
- **Nessun onclick inline**: rimossa la dipendenza da `window.go` globale per il bottom nav; il component usa event delegation interna via `mountBottomNavigation`. `go` resta esposto globalmente perché ancora usato da onclick inline dentro le viste (verrà eliminato progressivamente da Step 4 in poi).

### 2.3 app.js — `go('stats')` → `go('progressi')`

Riga 685 (post-`finishWorkout`):

**Prima:** `go('stats');` — funzionava solo grazie a `TAB_MIGRATION[stats]='progressi'` che veniva applicata *dopo* aver settato `S.tab='stats'` nel `go()` legacy. Rischio di stringa magica desincronizzata.

**Dopo:** `go('progressi');` — target diretto e canonico. `TAB_MIGRATION` resta per backward-compat (utenti con vecchi `localStorage.tab='stats'`).

### 2.4 app.js — `#themeBtn` handler rimosso

Rimosse le 5 righe:
```js
$('#themeBtn').onclick = () => {
    S.theme = S.theme === 'system' ? 'dark' : S.theme === 'dark' ? 'light' : 'system';
    localStorage.theme = S.theme;
    applyTheme();
};
```

**Motivo:** l'elemento `#themeBtn` non esiste più nel DOM (rimosso con top-bar). L'handler tentava `$('#themeBtn').onclick = …` su `null` → TypeError sicuro senza questa rimozione.

**Path tema disponibili dopo Step 3:**
- Utente OS in dark mode → tema `system` risolve a dark
- Console DevTools: `UI.setTheme('dark' | 'light' | 'amoled' | 'system')`
- Verrà esposto in UI in Step 11 Settings (chip selector 4 stati)

---

## 3. INVARIANTI PRESERVATE

### 3.1 Business logic

Verifica automatica — 39 occorrenze totali dei marker SACRE:
`logFor`, `beginWorkout`, `finishWorkout`, `resumeSession`, `discardSession`, `fillMissingFromPrevious`, `persistActive`, `fit-circuit-tracker-v18-optional-day`, `indexedDB.open` → tutti presenti.

### 3.2 State machine e route

- `go(t)`: firma e comportamento invariati. Continua a settare `S.tab`, chiama `render()`, applica animazione `tabAnim`, e gestisce close del select-sheet.
- `TAB_MIGRATION`: preservato. Utenti che riaprono l'app con vecchio `localStorage.tab='stats'` vengono automaticamente migrati a `'progressi'` al primo `render()`.
- `screens` map: invariato — `{ home, workout, progressi: stats, profilo: data }`. Le funzioni-vista `stats` e `data` restano invariate; verranno rinominate/rifattorizzate in step successivi.

### 3.3 Bridge tema

Il listener `ui:theme-set` introdotto in Step 2 resta operativo. `UI.setTheme('amoled')` continua a funzionare identicamente.

### 3.4 IndexedDB

DB `fit-circuit-tracker-v18-optional-day` v2 — schema, stores, index invariati.

---

## 4. VERIFICA MANUALE

### 4.1 UI

- [ ] Refresh → app carica, **top-bar assente**, `<main id="view">` a filo con il top dello schermo
- [ ] BottomNavigation visibile in basso: 4 tab con icone SVG (home, dumbbell, chart, user) + label "Home / Workout / Progressi / Profilo"
- [ ] Tab attiva ha `is-active` (colore `--color-primary`) e `aria-current="page"`
- [ ] Tap su tab non attiva → transizione a quella vista, `S.tab` aggiornato
- [ ] Tap sulla tab già attiva → nessun cambio (chiude eventuale select-sheet aperto)
- [ ] Nessun errore in console

### 4.2 Business logic (regression)

- [ ] Nuovo workout → INIZIA → serie → completa → `finishWorkout` → **navigazione automatica a "Progressi"** (era "stats" nel legacy, oggi "progressi")
- [ ] Sessione salvata in `S.sessions` (IndexedDB) — verifica DevTools → Application → IndexedDB
- [ ] Resume Modal riappare se si chiude tab a metà sessione
- [ ] Fillmissing / Discard funzionano identici
- [ ] Autosave `persistActive` on click/change/touchend/keyup invariato

### 4.3 Tema (regression dopo rimozione #themeBtn)

- [ ] All'avvio: tema iniziale rispetta `localStorage.theme` (o 'system' se assente)
- [ ] `<meta name="theme-color">` popolato dal token `--color-background` (Step 2)
- [ ] `UI.setTheme('amoled')` da console → background nero puro, `<html data-theme="amoled">`
- [ ] `UI.setTheme('light')` → torna a light
- [ ] Refresh → tema persistito
- [ ] **Nessun errore** "Cannot set properties of null (setting 'onclick')" in console (il vecchio `$('#themeBtn').onclick` era il rischio principale)

### 4.4 Accessibilità

- [ ] Tab bottom con `aria-label` "Home"/"Workout"/… (dal component)
- [ ] Tab attiva ha `aria-current="page"`
- [ ] `<nav role="navigation" aria-label="Navigazione principale">` presente (dal component)
- [ ] Focus visibile con Tab keyboard su ciascun bottone
- [ ] `prefers-reduced-motion` rispettato (durate a 0 via tokens)

### 4.5 PWA / cache

- [ ] Service worker si registra (`sw.js` v12, invariato)
- [ ] Se cache serve vecchio index.html: DevTools → Application → Service Workers → Unregister + hard reload
- [ ] Offline load OK

### 4.6 Dead code (accettato in Step 3)

Selettori CSS ora orfani in `styles.css` (nessun elemento DOM li matcha più):
- `.top`, `.brand`, `.brand h1`, `.brand .sub`, `.logo` (top-bar)
- `.bottomNav`, `.bottomNav .navItem`, `.bottomNav .navItem.active`, `.bottomNav .navItem svg`
- `#themeBtn` (mai definito esplicitamente ma il selettore inline in `<button id>` è sparito)
- `.navItem` in blocchi `:focus-visible`, `:active`, tap-highlight

**Non rimossi in Step 3**: `styles.css` verrà bonificato in Step 12 (audit §5.1 C8). Non impattano rendering perché non hanno match nel DOM.

---

## 5. ROLLBACK

Livello L1 (revert Step 3 mantenendo Step 1-2):

```bash
git checkout HEAD -- index.html app.js
```

Zero impatto su dati: IndexedDB non toccato. `styles.css`, `sw.js`, `manifest.json`, `tokens.css`, `components/*` non toccati in Step 3.

**Verifica post-rollback**: refresh browser → top-bar + `#themeBtn` legacy tornano; render usa `NAV_ICONS` inline.

---

## 6. GATE PER STEP 4 (Home redesign)

Step 4 può iniziare SE:

- ✅ Checklist §4.1-§4.5 completa (utente)
- ✅ 0 errori in console
- ✅ `finishWorkout` porta a Progressi senza glitch
- ✅ `UI.setTheme` da console funziona senza `#themeBtn`

**Cosa farà Step 4:**

1. Refactor della funzione `home()` per usare `HeroCard` / `WorkoutCard` / `EmptyCard` dal component library invece di HTML string inline
2. Implementazione della **Home selection sheet** (memoria `[[project_home_selection_sheet]]`) — bottom sheet slide-up per scheda/settimana/giorno via `BottomSheet` component
3. Sostituzione `onclick="go('workout')"` e `onclick="openSelectSheet()"` con handler event-delegated dai Card
4. **NON toccare** business logic (`beginWorkout`, `ctx()`, `resumeSession`, `discardSession`, autosave, IndexedDB)
5. **NON toccare** ancora `workout()`, `stats()`, `data()` — arrivano rispettivamente in Step 5, 6, 8

**Cosa NON farà Step 4:**

- Nessun cambio al DB schema
- Nessuna nuova Screen "Storico" (Progressi è ancora la stats() legacy)
- Nessun tocco al service worker (bump cache è Step 12)

---

## 7. STATO

✅ **Step 3 Navigation COMPLETATO** — top-bar eliminata, BottomNavigation component operativa, path route ripulito da alias legacy.

🛑 **STOP**. Attesa autorizzazione per Step 4 Home.
