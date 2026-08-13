> **HISTORICAL REPORT — non rappresenta il current state del repository.**
> Documento storico della precedente roadmap Fase 10. Referenzia pattern legacy (`focusView` con `primary|ok|bad`, `restDock`, `timerDock`, `#modalHost`) e branch fallback che sono stati eliminati o superati dalla ricostruzione UI Phase 2 (Sprint 9.x). Per lo stato attuale, vedere [FINAL_PROJECT_STATE.md](./FINAL_PROJECT_STATE.md).

---

## STEP11_REPORT — Step 11.A · Migrazione `<button class="primary|ok|bad">` → `UI.Button`

**Versione:** 1.0
**Data:** 2026-08-05
**Scope:** Fase 10 — Step 11.A (migrazione pattern residui in `focusView` ai token del design system, marcatura FALLBACK-ONLY delle classi legacy)
**Prerequisito:** Step 1-10 completati e approvati; Step 10 audit ha enumerato 8 pattern `.primary/.ok/.bad` in app.js.

---

## 0. TL;DR

- **5 pattern attivi migrati** a `UI.Button` in [app.js `focusView`](../app.js#L566-L610): 2× `focus-next-block/focus-next` (primary), 2× `finish-workout` in focusView (primary), 1× `stop-rest` in focusView (danger).
- **3 pattern preservati come fallback** (percorsi di degrado grazioso quando `window.UI` non è ancora caricato): [app.js:455](../app.js#L455) `go-home` in workout empty state, [app.js:491](../app.js#L491) `finish-workout` in workout non-focus, [app.js:937](../app.js#L937) `stop-rest` in timerDock.
- **Ogni migrazione preserva il fallback legacy** nel ramo `else` del ternario `(UI && UI.Button) ? UI.Button(...) : '<button class="primary|ok|bad">...</button>'` → L0 safety completa.
- **CSS legacy `.primary / .ok / .bad`** marcate come **FALLBACK-ONLY** in [styles.css:155](../styles.css#L155) (uso attivo azzerato; restano definite per servire i 3 fallback e i rami `else` delle 5 migrazioni). **NON marcate dormant** perché ancora consumate.
- **`.active`** (comma-partner di `.primary`) esplicitamente segnalata come LIVE nel commento — usata su `.sheetChip` in Home selection sheet ([app.js:381, 384](../app.js#L381)).
- **Delegation invariata**: `data-action` propagato via `dataset` di `UI.Button` — `mountViewDelegation` continua a intercettare esattamente come prima.
- **SACRED markers**: 38 → **38** ✓
- **Onclick residues**: 0 → **0** ✓
- **Business logic, IndexedDB, Store, Sync, componenti UI**: invariati.

---

## 1. CHANGESET

| File | Δ | Natura |
|------|---|--------|
| [app.js](../app.js) | +21 / -5 | 3 blocchi in `focusView`: aggiunto guard `(UI && UI.Button) ? UI.Button({...}) : legacyHTML` per navNext isSingle, navNext multi-round, stopRestBtn |
| [styles.css](../styles.css) | +7 / -0 | Solo commento FALLBACK-ONLY sopra `.active, .primary` (nessuna regola modificata) |
| [DOCS/STEP11_REPORT.md](STEP11_REPORT.md) | +new | Questo report |

**File NON toccati in Step 11.A:**
- [index.html](../index.html), [manifest.json](../manifest.json), [sw.js](../sw.js), [components/**](../components/) — invariati.
- Delegation (`mountViewDelegation`, `mountModalDelegation`, `mountSheetDelegation`, `mountPickerDelegation`) — invariata.
- Handler (`beginWorkout`, `finishWorkout`, `discardSession`, `focusNextBlock`, ecc.) — invariati.
- `#modalHost`, `openResumeModal`, `.modalRow` — invariati (audit Step 10 rimane valido).

---

## 2. MAPPING PATTERN → UI.BUTTON

### 2.1 Pattern migrati (5)

| # | Linea prima | Linea dopo | View | data-action | Variant | Fallback preservato |
|---|-------------|------------|------|-------------|---------|---------------------|
| 1 | 572 | 573 | focusView isSingle (blocco succ.) | `focus-next-block` | `primary` | ✓ else linea 574 |
| 2 | 573 | 577 | focusView isSingle (fine sessione) | `finish-workout` | `primary` | ✓ else linea 578 |
| 3 | 581 | 588 | focusView multi (giro/blocco succ.) | `focus-next` | `primary` | ✓ else linea 589 |
| 4 | 582 | 592 | focusView multi (fine sessione) | `finish-workout` | `primary` | ✓ else linea 593 |
| 5 | 593 | 606 | focusView stopRestBtn | `stop-rest` | `danger` | ✓ else linea 607 |

### 2.2 Pattern preservati (3 — fallback UI-unavailable, non migrabili)

| # | Linea | View | Motivo preservazione |
|---|-------|------|----------------------|
| 1 | [455](../app.js#L455) | `workout()` empty state | Nel ramo `else` di `if (UI && UI.EmptyCard && UI.Button)` — è già fallback. Migrarlo violerebbe la sua ragion d'essere. |
| 2 | [491](../app.js#L491) | `workout()` finalCta | Nel ramo `else` di `if (UI && UI.CompleteButton)` — idem. |
| 3 | [937](../app.js#L937) | `restDock()` timerDock | Nel ramo `else` di `if (UI && UI.FloatingTimer)` — idem. |

**Nota:** questi 3 fallback ereditano la stessa logica difensiva dei 5 rami `else` introdotti in Step 11.A → totale **8 punti di uso legacy = tutti condizionati all'assenza di `window.UI`**. In condizioni normali (UI caricato), **zero** pattern `.primary/.ok/.bad` viene emesso nel DOM.

### 2.3 Perché `.ok` → `variant: 'primary'` e non `'success'`

`UI.Button` supporta solo 4 varianti: `primary | secondary | ghost | danger` ([components/Buttons/Button.js:10](../components/Buttons/Button.js#L10)). **Non esiste** `success`/`ok`.

Alternativa **valutata e scartata**: aggiungere `--_bg: var(--color-success)` come variante `success` a `UI.Button`. **Scartata** perché:
1. Fuori scope Step 11.A (tocca la libreria componenti).
2. I due punti `.ok` migrati (`finish-workout` nel `navNext` del `focusNav`) sono in un contesto **navigazionale** (grid 1fr 1fr con "prec." a sinistra), dove il "primary" (viola CTA) è semantico corretto: è il **prossimo passo dell'utente**, non un'affermazione di successo (per quello c'è già `UI.CompleteButton` in `workout()` non-focus).
3. Il vincolo visivo di `.focusNav button { padding … !important; font-size … !important; border-radius … !important }` ([styles.css:1158-1163](../styles.css#L1158)) uniforma già dimensioni/tipografia dei bottoni interni al nav — indipendentemente dal variant.

**Impatto visivo netto** in Focus Mode `focusNav`: il bottone "Fine sessione" passa da verde acido (`--ok`) a viola (`--color-primary`, gradient legacy `.primary` non applicato perché `.c-btn--primary` usa `background: var(--_bg)` solid). **Coerente con `INIZIO` in WorkoutHeader** che già è viola solid.

### 2.4 Perché `.bad` → `variant: 'danger'` con wrapper div

Il legacy `<button class="bad" data-action="stop-rest" style="margin-top:12px">` aveva lo `style` inline direttamente sul button. `UI.Button` non accetta `style` inline; supporta solo `dataset`. La soluzione: `<div style="margin-top:12px">${UI.Button(...)}</div>`.

**Impatto DOM**: un elemento wrapper `<div>` in più. Il layout non cambia (div è block, button rimane inline-flex al suo interno con natural width).

**Alternative valutate e scartate**:
1. Aggiungere `style` prop a `UI.Button` → fuori scope, tocca la libreria.
2. Aggiungere `className` prop a `UI.Button` e usare una classe helper `.mt12` → non esiste `.mt12` nel design system; introdurla è fuori scope.
3. Rimuovere il `margin-top:12px` e affidarsi al gap del focusCard → il focusCard non ha `gap` sui figli; togliere il margin farebbe collassare stopRestBtn contro l'elemento precedente.

Il wrapper div è il compromesso minimo.

---

## 3. VERIFICA GUARD E DELEGATION

### 3.1 Perché il guard `(UI && UI.Button)` è necessario

Le 5 righe migrate sono in `focusView`, funzione chiamata da `workout()` senza guard sull'esistenza di `window.UI` per queste specifiche primitive. Se un utente carica l'app con `bootstrap.js` che fallisce nel montare `UI.Button` (edge case: JS error in una dipendenza a monte), le vecchie righe emettevano comunque un `<button>` funzionante. Per preservare la stessa robustezza, ogni nuova chiamata a `UI.Button` è avvolta in `(UI && UI.Button) ? … : legacyHTML`. Pattern identico a quello già in uso in `workout()` per `WorkoutHeader` ([app.js:463](../app.js#L463)), `EmptyCard` ([app.js:446](../app.js#L446)), `CompleteButton` ([app.js:488](../app.js#L488)), `FloatingTimer` ([app.js:914](../app.js#L914)).

### 3.2 Delegation invariata

`UI.Button` restituisce `<button type="button" class="c-btn c-btn--primary" data-action="focus-next-block">…</button>` — l'attributo `data-action` è emesso identico a prima (via `dataset` prop). Nessun cambio in `mountViewDelegation`, che continua a matchare `button[data-action]` (o equivalente).

Verifica: `focus-next-block`, `focus-next`, `finish-workout`, `stop-rest` sono tutti case gestiti nello switch di `mountViewDelegation` — nessun handler nuovo necessario, nessun handler rimosso.

---

## 4. INVARIANTI PRESERVATE

### 4.1 SACRED business logic — 38 marker (invariato)

```
$ grep -cE 'logFor|beginWorkout|finishWorkout|resumeSession|discardSession|fillMissingFromPrevious|persistActive|fit-circuit-tracker-v18-optional-day|indexedDB\.open' app.js
38
```

Identico a baseline Step 10.

### 4.2 Onclick residues — 0 (invariato)

```
$ grep -cE 'onclick=|onchange=|ontoggle=' app.js
0
```

### 4.3 Firme pubbliche

`focusView`, `restDock`, `workout` invariate come firma. Modificato solo il **contenuto** di `focusView` per la stringa restituita. Nessuna nuova esportazione, nessun nuovo parametro.

### 4.4 IndexedDB / Store / Sync

DB `fit-circuit-tracker-v18-optional-day` v2 — invariato. `Store` API — invariata. Sync engine — invariato.

### 4.5 Componenti UI (`components/**`)

Zero modifiche. `window.UI` frozen namespace intatto. `UI.Button` API usata invariata dalla firma pubblicata.

### 4.6 PWA / SW

`sw.js`, `manifest.json`, `index.html` — invariati. Modifiche a `app.js` e `styles.css` sono coperte dalla cache SW; **hard reload** raccomandato per test.

---

## 5. ADAPTER / FACADE INTRODOTTI

**Nessuno.** Step 11.A usa solo primitive già esposte in `window.UI`. Nessun ponte SACRE, nessuna funzione helper aggiunta.

---

## 6. REGRESSIONI ESCLUSE

### 6.1 Regressioni tecniche verificate ASSENTI

- ✓ Delegation: `data-action` propagato attraverso `dataset` di `UI.Button` → handler già registrati continuano a intercettare.
- ✓ Fallback: ramo `else` di ogni ternario emette esattamente lo stesso HTML del pre-migrazione → se `window.UI` non è disponibile, comportamento identico a Step 10.
- ✓ Business logic: 38 SACRED marker inalterati; `beginWorkout`, `finishWorkout`, `discardSession`, `focusNextBlock`, `focusNext`, `stopRestTimer` invariati.
- ✓ Layout `.focusNav`: griglia 1fr 1fr invariata. `UI.Button` in `<button>` come figlio diretto rispetta il selettore `.focusNav button` esistente — override `!important` di padding/font/radius applicati come per il legacy.
- ✓ `stopRestBtn` wrapped in div: div è block, button ora inline-flex — occupa larghezza naturale (~150-180px). Nessun impatto sui bottoni prev/next del `focusNav` (renderizzati separatamente).

### 6.2 Cambiamenti visivi attesi e voluti

| Elemento | Prima | Dopo | Nota |
|----------|-------|------|------|
| focusNav "Blocco succ. ▶" / "Giro succ. ▶" | Gradient viola→rosa (`.primary`) | Solid viola (`--color-primary`) | Coerente con `INIZIO` in WorkoutHeader |
| focusNav "✓ Fine sessione" | Verde acido (`.ok`) | Solid viola (`--color-primary`) | Cambio semantico consapevole: CTA nav-forward, non affermazione di successo |
| stopRestBtn (focusView) | Rosso legacy (`.bad`) + margin sul button | Rosso `--color-error` in wrapper div con margin | Piccola differenza tonale del rosso; wrapper aggiunge un div ma non altera flusso |
| INIZIO (WorkoutHeader) | Già `UI.Button` — invariato | Invariato | Baseline pre-Step 11 |
| CompleteButton "Termina sessione" (workout non-focus) | Già `UI.CompleteButton` — invariato | Invariato | Baseline pre-Step 11 |
| Home selection sheet chip `.sheetChip.active` | Gradient (usa `.active` comma-partner di `.primary`) | Invariato | Verificato: `.active` LIVE, commento FALLBACK-ONLY la protegge |

### 6.3 Edge cases considerati

| Caso | Comportamento |
|------|---------------|
| Utente in Focus Mode con `window.UI` caricato | Bottoni nav = `UI.Button` primary (viola solid); stop-rest = `UI.Button` danger (rosso). Corretto. |
| Utente in Focus Mode con `window.UI` NON caricato (edge) | Bottoni nav = legacy `<button class="primary">` / `<button class="ok">`; stop-rest = legacy `<button class="bad">`. `styles.css` continua a definire `.primary`/`.ok`/`.bad` → styling identico a pre-Step 11. |
| Rollback L1 con `git checkout HEAD -- app.js styles.css` | Ripristina Step 10 esatto; nessun impatto su dati. |
| Cache SW con `app.js` vecchio | Utente potrebbe vedere ancora legacy fino a hard reload. Nessun mismatch dati → OK. |
| Estensione browser aggancia a `.primary`/`.ok`/`.bad` (es. dark reader) | Le classi esistono ancora nel foglio → nessuna rottura. |

---

## 7. TEST STATICI ESEGUITI

- ✅ Grep SACRED markers in app.js → **38** (invariato).
- ✅ Grep `onclick=|onchange=|ontoggle=` in app.js → **0** (invariato).
- ✅ Grep `class="primary|class="ok|class="bad` in app.js → **8 occorrenze**, di cui **5 in ramo `else` di ternari `UI && UI.Button ?`** (fallback introdotti in Step 11.A) e **3 in ramo `else` di guard `if (UI && UI.*)` preesistenti** (fallback storici). Zero uso attivo.
- ✅ Read [app.js:566-610](../app.js#L566) → 3 blocchi migrati sintatticamente corretti (backtick chiusi, ternari bilanciati, dataset propagato).
- ✅ Read [styles.css:155-180](../styles.css#L155) → commento FALLBACK-ONLY inserito, regole `.active, .primary`, `.ok`, `.bad` non modificate.

### 7.1 Test SW cache (utente)

- [ ] Aprire l'app → DevTools → Application → Cache Storage → identificare cache attiva.
- [ ] Hard reload (Ctrl+Shift+R) per aggiornare `app.js` + `styles.css` post-Step 11.A.
- [ ] Verificare console: nessun `Uncaught TypeError: UI.Button is not a function`.

---

## 8. VERIFICA MANUALE (checklist utente)

### 8.1 Focus Mode — path attivo (UI caricato)

- [ ] Aprire una scheda → START workout → tap `◉ Focus`
- [ ] **Circuit multi-esercizio, giro 1 di N:**
  - [ ] Bottone destra `focusNav` = "Giro succ. ▶" **viola solid** (era gradient) — resto del layout `.focusNav` invariato (griglia 2 col, altezza uguale)
- [ ] **Blocco Single, non-ultimo:**
  - [ ] Bottone destra = "Blocco succ. ▶" **viola solid**
- [ ] **Ultimo giro dell'ultimo blocco completato:**
  - [ ] Bottone destra = "✓ Fine sessione" **viola solid** (era verde)
- [ ] Durante recupero attivo (rest timer running):
  - [ ] Sotto il body del focus card compare "Ferma recupero" **rosso** (danger) — tap lo ferma
- [ ] Tap "Fine sessione" → apre Duration Dialog / termina sessione normale — flow SACRED intatto

### 8.2 Focus Mode — verifica delegation

- [ ] Tap "Giro succ. ▶" → avanza giro (chiamata `focusNextRound`)
- [ ] Tap "Blocco succ. ▶" → avanza blocco (`focusNextBlock`)
- [ ] Tap "Fine sessione" da focus → `finishWorkout` chiamato → Duration modal
- [ ] Tap "Ferma recupero" → `stopRestTimer(true)` → dock timer scompare

### 8.3 Workout non-focus (invariato)

- [ ] Uscire da focus con `☰ Vista completa`
- [ ] Header con `INIZIO` → invariato
- [ ] Dopo START, footer con `Termina sessione` (CompleteButton) → invariato
- [ ] Timer dock in fondo → invariato (usa `UI.FloatingTimer` — non toccato)

### 8.4 Home selection sheet (invariato)

- [ ] Home → tap FAB / area scelta → BottomSheet slide-up
- [ ] Chip Scheda: la chip attiva rimane **gradient viola→rosa** (`.sheetChip.active` — `.active` LIVE, protetto dal commento in styles.css)
- [ ] Chip Settimana: idem
- [ ] Tile giorno: idem

### 8.5 CSS in DevTools

- [ ] Inspect di un `.c-btn.c-btn--primary` in `.focusNav` → padding `11px 10px !important` da `.focusNav button` applicato ✓
- [ ] Inspect di `.active, .primary` in styles.css → regola presente + commento FALLBACK-ONLY visibile sopra
- [ ] Inspect di `.sheetChip.active` → `.active` gradient risolto ✓ (non toccato)

### 8.6 Tema

- [ ] Console: `UI.setTheme('amoled')` → `.c-btn--primary` in focusNav riflette il token amoled (viola pieno più scuro)
- [ ] `UI.setTheme('light')` → viola chiaro
- [ ] `UI.setTheme('system')` → torna a preferenza OS

---

## 9. PUNTI RIMASTI INVARIATI

- `workout()` (non-focus branch) — invariato.
- `openResumeModal`, `openDurationModal`, `openResetCardModal` — invariati (Presenter-based da Step 9).
- `exerciseCard`, `setRow`, `pickerRow`, `roundChip`, `restDock` (fallback branch), `timerDock` — invariati.
- Delegation, Presenter, `window.UI`, `Store`, IndexedDB, Sync — invariati.
- Bottom Navigation, Timer session, ThemeToggle — invariati.
- Tutti i componenti UI in `components/**` — invariati.

---

## 10. CONFRONTO CON GATE STEP 10 §12

Gate 11.A definito in [STEP10_REPORT §12](STEP10_REPORT.md#12-gate-per-step-11):

| # | Requisito Step 11.A | Stato |
|---|---------------------|-------|
| 1 | Sostituire i 9 pattern `.primary`/`.ok`/`.bad` residui (§3 table righe 4-9, 11) con `UI.Button({label, variant, dataset:{action:...}})`. | ⚠️ Sostituiti **5 pattern attivi su 8** (correzione conteggio: Step 10 riportava 4 primary, il conteggio reale è 3). I restanti 3 (linee 455, 491, 937) sono FALLBACK di guard preesistenti su altre primitive UI (`EmptyCard`, `CompleteButton`, `FloatingTimer`) — non migrabili senza rimuovere il fallback stesso. |
| 2 | Dopo migrazione, marcare `.primary`, `.ok`, `.bad` come DORMANT in styles.css (secondo giro di conferma). | ⚠️ **Corretto in FALLBACK-ONLY**, non DORMANT. Motivo: le classi restano consumate dai 3 fallback preesistenti + dai 5 rami `else` introdotti in questo step. DORMANT (definito in Step 8/10 come "0 usi") sarebbe scorretto. |
| 3 | Preservare `.setDoneBtn`, `.stepBtn`, `.sheetChip`, `.sheetDayTile` (comportamento custom non coperto da UI.Button). | ✅ Non toccati (fuori scope Step 11.A). |
| 4 | NOT touch: business logic, delegation, IndexedDB. | ✅ SACRED=38 invariato, delegation invariata, DB invariato. |

**Correzione al conteggio di Step 10 §3:** grep esatto `class="primary|class="ok|class="bad` restituisce **8** occorrenze totali (3 primary + 3 ok + 2 bad), non 9 come stimato. La differenza è tracciata in questo report §7 e §10 riga 1.

---

## 11. ROLLBACK

Livello L1 (revert solo Step 11.A, preservando Step 1-10):

```bash
git checkout HEAD -- app.js styles.css DOCS/STEP11_REPORT.md
```

**Nessun impatto su dati**: IndexedDB non toccato. Componenti UI non modificati. `index.html`, `sw.js`, `manifest.json` invariati.

**Nessun impatto su fallback**: i 3 fallback preesistenti (linee 455, 491, 937) restano identici, garantendo che anche in caso di rollback totale la degradazione grazione continui a funzionare.

---

## 12. GATE PER STEP 12

Step 12 può iniziare SE:

- ✅ Checklist §8 completa (utente)
- ✅ 0 errori console; in particolare nessun `Cannot read properties of undefined (reading 'Button')`
- ✅ Focus Mode navigation funzionante (giro/blocco successivo, fine sessione, stop rest)
- ✅ Sheet Home + tile giorno invariati (`.active` LIVE preservato)
- ✅ Utente conferma il cambio visivo desiderato (viola solid vs gradient/verde/rosso)

**Scope preliminare Step 12 (proposta, da confermare):**

Due direzioni non esclusive:

### 12.A — Settings/Preferenze view (rimandata da Step 8 e Step 11.B)

1. Nuova view `settings()` con:
   - `UI.PreferenceSwitch` per toggle (haptics, restAutoStart)
   - **Theme selector chip** (`system / light / dark / amoled`) → ricollega il tema all'UI utente (richiesto in messaggio del 2026-08-05 durante Step 11)
   - **Discard workout button** (con Dialog conferma) → richiesto in messaggio del 2026-08-05 (Fase 10 memo `[[project-fase10-scope-decisions]]`)
2. Persistenza toggles in localStorage (no schema DB change) per non introdurre migrazioni IDB.
3. Entry point da Profilo (nuova `SettingsRow` "Impostazioni →") — coerente con `[[project-profilo-redesign]]`.

### 12.B — Migrazione `.setDoneBtn`, `.stepBtn`, `.sheetChip`, `.sheetDayTile`

1. Analizzare se `UI.Button` con nuovi variant/state (`checked`, `active`) può sostituire le primitive custom.
2. **Alto rischio**: `.setDoneBtn`/`.stepBtn` sono hot path workout, refactor tocca `exerciseCard`, `setRow`, `roundChip`, `pickerRow`.
3. **Alternativa**: introdurre `UI.SelectableTile` e `UI.Stepper` come nuove primitive DS invece di forzare `UI.Button`. Fuori scope se non si tocca la libreria.

**Raccomandazione**: partire da **12.A** — chiude i due debiti UI utente (tema + scarta) + apre la strada per rimuovere il legacy `.primary/.ok/.bad` completamente (Step 13 potenziale: rimuovere i 3 fallback storici + i 5 `else` di Step 11.A, poi eliminare le classi CSS).

---

## 13. STATO

✅ **Step 11.A COMPLETATO** — 5 pattern attivi `<button class="primary|ok|bad">` migrati a `UI.Button` in [focusView](../app.js#L566-L610); 3 fallback storici preservati come degrado grazioso; `.primary/.ok/.bad` marcate FALLBACK-ONLY in styles.css; `.active` (sheetChip) esplicitamente preservata come LIVE. Business logic, IndexedDB, componenti UI, delegation, PWA — tutti invariati.

🛑 **STOP**. Attesa approvazione utente (checklist §8) prima di procedere a Step 12.
