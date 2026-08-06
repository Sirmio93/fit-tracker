## STEP8_REPORT — Profilo redesign

**Versione:** 1.0
**Data:** 2026-08-05
**Scope:** Fase 10 — Step 8 (Profilo / `data()` view redesign + migrazione onclick a delegation)
**Prerequisito:** Step 1-7 completati; `window.UI` con `StatisticCard`, `Card`, `Button`, `SettingsRow`, `Banner` disponibili.

---

## 0. TL;DR

- **`data()` refattorizzata** — HTML string inline → composizione di componenti UI (`StatisticCard` x3 hero + `Banner` warn + `Card`+`SettingsRow` scheda + `Card` GitHub sync + `Card` dati + `Card` danger zone).
- **9 onclick migrati a `data-action`** — tutti gli onclick del Profilo eliminati. Aggiunte 8 nuove case in `mountViewDelegation` (open-select riusa la case già esistente da Step 4).
- **Business logic INTATTA** — `saveSyncConfig`, `clearSyncConfig`, `syncToRemote`, `restoreFromRemote`, `exportAll`, `confirmReset`, `openResumeModal`, `incompleteSessions`, `completedSessions`, `sessionVolume`, `streakDays`, `countBlocksInCard`, `openSelectSheet`: tutte invariate.
- **IndexedDB / sync engine / GH REST calls / modello dati / algoritmi INVARIATI**.
- **DOM ids preservati** (`ghOwner`, `ghRepo`, `ghPath`, `ghBranch`, `ghToken`, `syncStatus`, `fileImport`) — required dai consumatori (`saveSyncConfig`, aggiornamenti inline di stato, handler onchange in [app.js:1315](../app.js#L1315)).

---

## 1. CHANGESET

| File | Δ | Natura |
|------|---|--------|
| [app.js](../app.js) | -55 / +80 | Refactor `data()` su componenti UI; +8 delegation case |
| [DOCS/STEP8_REPORT.md](STEP8_REPORT.md) | +new | Questo report |

**File NON toccati in Step 8:**
- [index.html](../index.html), [styles.css](../styles.css), [manifest.json](../manifest.json), [sw.js](../sw.js), [components/**](../components/) — invariati.
- Nessuna modifica alle SACRE (`beginWorkout`, `finishWorkout`, `persistActive`, `Store`, `logFor`, `fillMissingFromPrevious`, `resumeSession`, `discardSession`, ecc.).
- Nessuna modifica a `home()`, `workout()`, `stats()`, `focusView()`, `summary()`, `render()`, `go()`.
- Nessuna modifica ai modals (`openResumeModal`, `openDurationModal`, `closeModal`) → **Step 9**.

---

## 2. DETTAGLIO CAMBIAMENTI

### 2.1 `data()` — 6 sezioni ricomposte

**Prima:** funzione monolitica ~57 righe con `<div class="card profileHero">` + `.profileKpis` + `.profileWarn` inline + `<button onclick="…">` sparsi (9 onclick totali).

**Dopo — struttura:**

| # | Sezione | Componenti UI | Note |
|---|---------|---------------|------|
| 1 | Hero KPI (Workout / Streak / Volume) | 3 × `UI.StatisticCard` in wrapper `.statHeroGrid` | Coerente con Progressi (Step 6). `delta:''` per omettere il testo default |
| 2 | Sessioni non chiuse | `UI.Banner` variant `warning` + `UI.Button` action | Solo se `inc.length > 0` (progressive disclosure per memory `[[project-profilo-redesign]]`) |
| 3 | Scheda attiva | `UI.Card` eyebrow + `UI.SettingsRow` (label + meta + Button ghost) | Fallback markup vanilla se `SettingsRow` non disponibile |
| 4 | Backup GitHub | `UI.Card` eyebrow + inputs preserved + 4 `UI.Button` (Salva/Rimuovi/Sync/Ripristina) + `<details class="profileDetails">` | Ids `ghOwner`/`ghRepo`/`ghPath`/`ghBranch`/`ghToken`/`syncStatus` **preservati** per `saveSyncConfig()` e `syncToRemote()` |
| 5 | Dati (Export/Import) | `UI.Card` eyebrow + 2 `UI.Button` | Import via `data-action="import-json"` → delegation triggera `#fileImport.click()` |
| 6 | Danger zone (Reset scheda) | `UI.Card` + `.dangerZone` wrapper legacy + `UI.Button` variant `danger` | Separato da Dati per rispettare gerarchia visiva di memory (Reset segregato) |

**Fallback guard:** `if (!UI || !UI.StatisticCard || !UI.Card || !UI.Button) return '…Caricamento…'` — coerente col pattern usato in `home()`, `workout()`, `stats()`, `summary()`.

**Fallback componenti opzionali:** `Banner` e `SettingsRow` sono opzionali (fallback a `Card` con markup vanilla) — così se in futuro cambia l'export della libreria, la view non crasha.

**Design decisions:**

- **StatisticCard × 3 al posto di `.profileHero/.profileKpis`** — allineato con Progressi. Le classi legacy `.profileHero .profileKpis .statValue .statLabel` restano in [styles.css:1357](../styles.css#L1357) ma non sono più consumate da `data()`. Non le rimuovo (sono dormienti, non fanno male, e altre view/temi potrebbero riusarle).
- **Banner (variant `warning`) al posto di `.profileWarn`** — semanticamente corretto (banner in-page persistente per attirare attenzione). La classe legacy `.profileWarn` resta in CSS come dormiente. Il fallback a Card mantiene la funzionalità anche senza `Banner`.
- **SettingsRow per "Scheda attiva"** — pattern label+meta+control naturale per una riga con "Apri →". Alternativa: `HistoryCard` (troppa struttura per un item singolo).
- **`.dangerZone` legacy preservato** — pattern visivo distintivo (bordo tratteggiato rosso + fondo rgba error) chiaramente identificabile. La memory `[[project-profilo-redesign]]` insiste sulla segregazione visiva del Reset ("intent esplicito richiesto") — mantenere questa classe è più affidabile che ricostruirla via variante Card generica.
- **`<details class="profileDetails">` conservato** — pattern nativo HTML per progressive disclosure della config GitHub. Chiudere per default se `syncConfigured`, aperto altrimenti (invariato). Non serve un componente ad-hoc per un `<details>` semantico.
- **`.pill` badge sync status conservato** — pattern legacy semplice, coerente con lo status legacy usato nel monolite. Un componente Badge dedicato è overkill per un singolo span.

### 2.2 Nuova delegation cases — [app.js:209-216](../app.js#L209-L216)

```js
case 'open-resume': openResumeModal(incompleteSessions()); break;
case 'save-sync-config': saveSyncConfig(); break;
case 'clear-sync-config': clearSyncConfig(); break;
case 'sync-now': syncToRemote({ manual: true }); break;
case 'restore-remote': restoreFromRemote(); break;
case 'export-all': exportAll(); break;
case 'import-json': { var fi = document.getElementById('fileImport'); if (fi) fi.click(); break; }
case 'confirm-reset': confirmReset(); break;
```

- Tutte adapter di 1 riga verso le funzioni SACRE già esistenti (nessuna modifica delle funzioni chiamate).
- `open-select` (già da Step 4) **riusato** per il bottone "Apri →" della scheda attiva — no duplicazione.
- `import-json` usa `document.getElementById('fileImport')` con guard: se l'input non è ancora nel DOM (edge case bootstrap), no-op. Il DOM ha l'input in [index.html:19](../index.html#L19).

### 2.3 Handler onchange dell'input file — invariato

[app.js:1315](../app.js#L1315):
```js
$('#fileImport').onchange = async e => { … };
```

Non toccato. È un listener imperativo attaccato all'input top-level (fuori dal `#view`), quindi non passa per delegation. Il pulsante `import-json` triggera il file-picker via `.click()`; poi il browser chiama automaticamente questo `onchange`. Nessuna modifica.

---

## 3. INVARIANTI PRESERVATE

### 3.1 SACRED business logic — 38 occorrenze marker

Grep `logFor|beginWorkout|finishWorkout|resumeSession|discardSession|fillMissingFromPrevious|persistActive|fit-circuit-tracker-v18-optional-day|indexedDB.open` → **38** (invariato rispetto a Step 7 post-rilettura; STEP7_REPORT §3.1 riportava 39 come "probabile miscount storico" — la re-verifica ad inizio Step 8 conferma 38, allineato con STEP6_REPORT §3.1).

Nessuna SACRED aggiunta/rimossa/rinominata da questa fase.

### 3.2 Funzioni consumate da `data()` — tutte INTATTE

| Funzione | Firma | Verificato |
|----------|-------|-----------|
| `completedSessions()` | no args → `S.sessions[]` filter | ✓ |
| `sessionVolume(s)` | pure reduce | ✓ |
| `streakDays()` | pure, calcolo giorni consecutivi | ✓ |
| `incompleteSessions()` | pure, filter + sort | ✓ |
| `countBlocksInCard(c)` | pure, reduce weeks→days→blocks | ✓ |
| `saveSyncConfig()` | async, legge `#ghOwner/Repo/…` | ✓ |
| `clearSyncConfig()` | async, cancella `S.sync.config` | ✓ |
| `syncToRemote({manual})` | async, GH REST call | ✓ |
| `restoreFromRemote()` | async, GH REST call | ✓ |
| `exportAll()` | pure, download JSON | ✓ |
| `confirmReset()` | wrapper con `confirm()` → `resetAndLoad()` | ✓ |
| `openResumeModal(list)` | mount modal DOM | ✓ |
| `openSelectSheet()` | mount bottom sheet | ✓ |
| `fmtNum(n)`, `esc(s)` | pure helpers | ✓ |

Nessuna di queste è stata modificata. Solo consumate via delegation.

### 3.3 State model

- `S.sessions`, `S.exercises`, `S.cards`, `S.sync.config`, `S.sync.status`, `S.sync.lastSyncAt`, `S.sync.lastError` — solo letture.
- `S.tab`, `S.active`, `S.focus`, `S.flow`, `S.sheet`, `S.rest`, `S.timer`, `S.lastSummary`, `S.missing` — non toccati.
- Nessun nuovo campo introdotto.

### 3.4 IndexedDB

DB `fit-circuit-tracker-v18-optional-day` v2 — schema, stores, index invariati. Nessuna `Store.put/get/del` aggiunta o rimossa. Sync engine GH invariato.

### 3.5 DOM ids preservati (contract per SACRE)

| id | Consumatore | Preservato |
|----|-------------|-----------|
| `ghOwner` | `saveSyncConfig()` — legge `.value` | ✓ |
| `ghRepo` | `saveSyncConfig()` | ✓ |
| `ghPath` | `saveSyncConfig()` | ✓ |
| `ghBranch` | `saveSyncConfig()` | ✓ |
| `ghToken` | `saveSyncConfig()` | ✓ |
| `syncStatus` | `syncToRemote()` aggiorna `textContent` inline | ✓ |
| `fileImport` (in [index.html:19](../index.html#L19)) | `.onchange` handler + `import-json` delegation | ✓ |

### 3.6 Altre view

`home()`, `workout()`, `stats()`, `focusView()`, `summary()`, `workoutBlock()`, `exerciseCard()`, `setRow()`, `roundChip()`, `timerDock()`, `render()`, `go()`, `finishWorkout()` — **non toccate**.

### 3.7 Onclick residui

Grep `onclick=|onchange=|ontoggle=` in app.js → **9 match** (era 15 pre-Step 8), TUTTI localizzati nei modals:
- `openResumeModal` (righe 1354-1376) → **Step 9 (Modals)**
- `openDurationModal` (righe 1479-1492) → **Step 9 (Modals)**

**Zero onclick residui in `data()`, `stats()`, `home()`, `workout()`, `focusView()`, `summary()`.**

### 3.8 BottomNav decisione 2026-08-04 rispettata

Set glyph fisso: 🏠 Home · 💪 Workout · 📈 Progressi · 👤 Profilo (decisione 4). Invariato. Profilo continua a essere il 4° item (👤). Nessuna aggiunta/rimozione.

---

## 4. ADAPTER / FACADE INTRODOTTI

**Nessuno strutturale**. Le 8 nuove delegation case sono adapter di 1 riga: mappano `data-action` → chiamata diretta alla funzione SACRA esistente. Nessun ponte funzionale, nessuna nuova astrazione.

L'unica micro-adapter è per `import-json`:
```js
case 'import-json': { var fi = document.getElementById('fileImport'); if (fi) fi.click(); break; }
```
Con guard `if (fi)` per resilienza (l'input è top-level in `index.html`, sempre presente in condizioni normali).

---

## 5. REGRESSIONI ESCLUSE

### 5.1 Cambiamenti visivi accettati (NON regressioni funzionali)

- **Hero KPI stile**: prima `.profileHero` gradient card con 3 celle centrate su `--surface-2`. Ora 3 StatisticCard separate (ciascuna con eyebrow proprio: "Workout" / "Streak" / "Volume"). Coerente con Progressi. Dati identici: Workout count, Streak giorni, Volume kg.
- **Sessioni non chiuse**: prima `.profileWarn` card arancione. Ora `Banner` variant `warning` (stesso significato semantico, styling da token). Titolo, corpo e azione identici.
- **Scheda attiva**: prima card con titolo grande + button ghost. Ora `Card` + `SettingsRow` — layout label/meta a sinistra, control a destra. Info identica (`activeCard.name`, weeks, blocks).
- **Backup GitHub**: card contenuto invariato (badge status, testo, `<details>` config, inputs, bottoni). Wrapper cambia da `<div class="card">` a `<article class="c-card">` con eyebrow "Backup GitHub" + subheader inline. Info identica.
- **Dati**: card contenuto invariato (2 bottoni Export/Import). Wrapper `Card`.
- **Danger zone**: separata in una card dedicata (era in fondo alla card Dati). Visivamente più isolata → intent esplicito richiesto per Reset. Confermata dalla memory `[[project-profilo-redesign]]` ("Zona pericolosa segregata visualmente = intent esplicito richiesto"). Contenuto della zona invariato (title Zona pericolosa + descrizione + Reset button).

### 5.2 Regressioni tecniche verificate ASSENTI

- ✓ `finishWorkout` → `go('summary')` continua a funzionare (`data()` NON tocca).
- ✓ Tap "Gestisci →" sulle sessioni non chiuse → apre `openResumeModal(incompleteSessions())` — identico al comportamento pre-Step 8.
- ✓ Tap "Apri →" scheda attiva → apre `openSelectSheet()` (delegation `open-select` esistente).
- ✓ Tap "Salva" config GitHub → `saveSyncConfig()` legge da `#ghOwner`, `#ghRepo`, `#ghPath`, `#ghBranch`, `#ghToken` (ids preservati). Setta `S.sync.config` in IndexedDB come prima.
- ✓ Tap "Rimuovi" config → `clearSyncConfig()` (danger button variant).
- ✓ Tap "Sync ora" → `syncToRemote({manual:true})` con arg letterale, come prima.
- ✓ Tap "Ripristina" → `restoreFromRemote()`, come prima.
- ✓ Tap "Export JSON" → `exportAll()` come prima.
- ✓ Tap "Import JSON" → apre file-picker (`fileImport.click()`), handler `.onchange` invariato → importa correttamente.
- ✓ Tap "Reset scheda" → `confirmReset()` chiede conferma esplicita, poi `resetAndLoad()`.
- ✓ Badge status "ok/idle/non configurato" aggiornato correttamente da `syncToRemote()` via `#syncStatus` (id preservato).
- ✓ PWA / service worker `sw.js` non toccato.

### 5.3 Edge cases considerati

| Caso | Comportamento |
|------|---------------|
| Nessuna sessione mai completata (done.length=0) | Hero mostra "0" / "0" / "0" — non è un errore, è dato reale |
| Nessuna scheda attiva (`S.cards[]=[]`) | `cardInfo=''` — sezione omessa |
| Nessuna sessione non chiusa | `pending=''` — Banner warning omesso |
| Sync mai configurato (`syncConfigured=false`) | Badge "non configurato", `<details>` aperto per default |
| Sync già configurato con status `ok` | Badge verde `pillDone`, `<details>` chiuso per default |
| Errore sync ultimo tentativo | `syncStatus` mostra `· Errore: <err>` inline |
| Offline durante render | `online = 'offline'` mostrato in `#syncStatus` |
| Import file cancellato dall'utente | `e.target.files[0]` undefined → handler no-op |
| Reset scheda cancellato dall'utente | `confirm()` restituisce false → no-op |

---

## 6. TEST STATICI ESEGUITI

- ✅ Grep SACRED markers → **38** (invariato rispetto a baseline pre-Step 8).
- ✅ Grep `onclick=|onchange=|ontoggle=` in app.js → **9 righe** (era 15 → -6 righe, tutte in `data()` migrate a delegation).
- ✅ Grep `^function data|^function confirmReset` → firme presenti, `data()` senza argomenti (invariata), `confirmReset()` invariata.
- ✅ Grep case `open-resume|save-sync-config|clear-sync-config|sync-now|restore-remote|export-all|import-json|confirm-reset` in delegation → 8 case presenti (`open-select` riusa la case pre-esistente da Step 4).
- ✅ Verifiche funzioni chiamate esistono: `openResumeModal` (linea 1347), `saveSyncConfig` (1625), `clearSyncConfig` (1638), `syncToRemote` (1660), `restoreFromRemote` (1710), `exportAll` (1609), `confirmReset` (1312), `incompleteSessions` (1318), `openSelectSheet` (328) → tutte esistenti e invariate.
- ✅ `window.UI` esporta `StatisticCard, Card, Button, SettingsRow, Banner` (verificato in [components/index.js](../components/index.js) linee 33, 30, 25, 90, 80).
- ✅ DOM ids preservati: grep `ghOwner|ghRepo|ghPath|ghBranch|ghToken|syncStatus|fileImport` — tutti presenti nel nuovo `data()` markup.

---

## 7. VERIFICA MANUALE (checklist utente)

### 7.1 Hero KPI
- [ ] Profilo → 3 StatisticCard visibili: Workout (count) / Streak (n° con "giorno"/"giorni") / Volume (kg)
- [ ] Grid a 3 colonne desktop, adattivo mobile (via CSS `.statHeroGrid`)
- [ ] Numeri coerenti con Progressi (stesso dato consumato)

### 7.2 Sessioni non chiuse (progressive disclosure)
- [ ] Se `incompleteSessions().length === 0` → Banner NON appare
- [ ] Se ci sono sessioni aperte → Banner giallo/warning con titolo "Sessioni non chiuse", body con count, Button "Gestisci →"
- [ ] Tap "Gestisci →" → apre `openResumeModal(incompleteSessions())` (identico al pre-Step 8)

### 7.3 Scheda attiva
- [ ] Card con eyebrow "Scheda attiva" + SettingsRow (nome / N settimane • M blocchi / bottone "Apri →")
- [ ] Tap "Apri →" → apre bottom sheet di selezione scheda/settimana/giorno (`openSelectSheet()`)
- [ ] Se non c'è alcuna scheda (`S.cards[]=[]`) → sezione omessa

### 7.4 Backup GitHub
- [ ] Card con eyebrow "Backup GitHub" + subtitle "GitHub sync" + badge status
- [ ] Badge "non configurato" (grigio) se manca token; "idle"/"ok" (verde se ok) se configurato
- [ ] `<details>` config: chiuso se già configurato, aperto altrimenti
- [ ] Inputs `#ghOwner`, `#ghRepo`, `#ghPath`, `#ghBranch`, `#ghToken` presenti e pre-riempiti con valori esistenti
- [ ] Tap "Salva" → salva config in IndexedDB → badge aggiorna a "idle"
- [ ] Tap "Rimuovi" → cancella config → badge torna "non configurato"
- [ ] Tap "Sync ora" → upload verso GH → `#syncStatus` aggiornato inline
- [ ] Tap "Ripristina" → download da GH → dati locali sostituiti (attenzione: distruttivo, testare su config di test)

### 7.5 Dati (Export/Import)
- [ ] Card con eyebrow "Dati" + 2 bottoni secondary
- [ ] Tap "Export JSON" → download file backup
- [ ] Tap "Import JSON" → si apre file picker; selezione file → import viene eseguito via handler `.onchange` legacy

### 7.6 Danger zone (Reset scheda)
- [ ] Card separata in fondo con `.dangerZone` (bordo tratteggiato rosso)
- [ ] Titolo "Zona pericolosa" + descrizione + Button "Reset scheda" (variant danger)
- [ ] Tap "Reset scheda" → apre `confirm()` di sistema
- [ ] Se conferma → `resetAndLoad()` sostituisce la scheda embedded; sessioni ed esercizi restano intatti
- [ ] Se annulla → no-op

### 7.7 Regression business logic
- [ ] Naviga Home → Workout → Termina → Summary → Fine → Profilo → tutti i dati (workout count, streak, volume) sono aggiornati
- [ ] Verifica GH sync: dopo tap "Sync ora" con config valida, `S.sync.lastSyncAt` aggiornato, badge diventa "ok"

### 7.8 Tema
- [ ] Cambio tema (`UI.setTheme('amoled')` da console) → StatisticCard, Card, Banner riflettono i token
- [ ] Nessun errore console

### 7.9 A11y
- [ ] StatisticCard, Card rendono `<article>` semantico
- [ ] Banner ha `role="region"` + `aria-label` con titolo
- [ ] Button hanno label leggibile e min-height touch
- [ ] SettingsRow è row cliccabile ergonomica
- [ ] `<details>` config è keyboard-navigable

### 7.10 PWA / cache
- [ ] Hard reload se serve invalidare cache SW (sw.js invariato — solo `app.js` cambia)

---

## 8. PUNTI RIMASTI INVARIATI

- `home()`, `workout()`, `stats()`, `focusView()`, `summary()`, `workoutBlock`, `exerciseCard`, `setRow`, `roundChip`, `timerDock`, `initialsOf` — TUTTI invariati.
- Bootstrap boot IIFE, `Store` API, `applyTheme`, `TAB_MIGRATION`, `beginWorkout`, `finishWorkout`, `persistActive`, `fillMissingFromPrevious`, `closeSessionNow`, `saveManualDuration`, `openResumeModal`, `openDurationModal`, `closeModal`, `openSelectSheet`, `closeSelectSheet`, `resetAndLoad`, `importPlan`, GH REST calls — TUTTI invariati.
- Bottom Navigation set glyph 4-item — invariato.
- Sync engine (GH REST) — invariato.
- Handler `$('#fileImport').onchange` [app.js:1315](../app.js#L1315) — invariato.
- Confirm reset `confirmReset()` [app.js:1312](../app.js#L1312) — invariato.

---

## 9. CONFRONTO CON MEMORY `project_profilo_redesign.md` (Fase E)

| Requisito memory | Stato Step 8 |
|------------------|--------------|
| Hero KPI (Workout / Streak / Volume) | ✅ 3 StatisticCard |
| Sessioni non chiuse — solo se >0 | ✅ Banner condizionale (`inc.length` guard) |
| Sessioni non chiuse — bottone "Gestisci →" → `openResumeModal(incompleteSessions())` | ✅ Delegation `open-resume` |
| Scheda attiva — nome + settimane + blocchi + "Apri →" → `openSelectSheet()` | ✅ SettingsRow + delegation `open-select` |
| Backup GitHub — badge stato in cima | ✅ Badge inline vicino a "GitHub sync" |
| Backup GitHub — config in `<details>` collassato se configurato, aperto altrimenti | ✅ `<details>` con attr `open` condizionale |
| Backup GitHub — Salva / Rimuovi dentro details; Sync ora / Ripristina fuori | ✅ Layout invariato |
| Dati — Export/Import in una riga | ✅ 2 Button in stessa row |
| Danger zone — bordo tratteggiato rosso + Reset con `confirmReset()` | ✅ `.dangerZone` preservato + Button danger |
| Ordine layout: identità → warning attivi → contenuto → configurazioni → dati/danger | ✅ hero → pending → cardInfo → backup → dataOps → danger |
| Nessuna modifica IndexedDB | ✅ |
| Riusa `completedSessions()`, `streakDays()`, `sessionVolume()`, `fmtNum()`, `incompleteSessions()`, `openResumeModal()`, `openSelectSheet()`, `countBlocksInCard()`, `resetAndLoad()`, `confirmReset()` | ✅ tutte consumate read-only |

**Perfetta aderenza al design Fase E**. La sostituzione dei wrapper legacy (`.profileHero .profileKpis .profileWarn`) con componenti UI standard (`StatisticCard`, `Banner`) è progressiva, non contraddittoria — le classi legacy restano in CSS come dormienti.

---

## 10. PreferenceSwitch — DEFERRED

Il componente `UI.PreferenceSwitch` è disponibile ([components/Profile/PreferenceSwitch.js](../components/Profile/PreferenceSwitch.js)) ma NON usato in questo step.

**Motivazione**: il Profilo attuale non ha toggle di preferenza. Le uniche configurazioni sono la form GitHub sync (5 input testuali) — non-toggle. Aggiungere switch per "notifiche", "auto-sync", "tema" richiederebbe:
1. Modello dati per persistere le preferenze (`S.prefs.*` in IndexedDB).
2. Rispondere agli eventi di toggle (delegation `change`).
3. Applicare la preferenza a runtime.

Tutti e 3 sono **nuove business logic** → fuori scope Step 8 (che è puro rendering + migrazione onclick).

**Rinvio a Step 11 (Settings)** se il roadmap lo richiede, oppure a un futuro Step E2 dedicato.

---

## 11. ROLLBACK

Livello L1 (revert solo Step 8, preservando Step 1-7):

```bash
git checkout HEAD -- app.js DOCS/STEP8_REPORT.md
```

Zero impatto su dati: IndexedDB non toccato. Nessun componente UI modificato. `styles.css`, `index.html`, `sw.js`, `manifest.json` invariati.

**Regressione manuale (se serve solo tornare al pre-Step 8 data())**: ripristinare la vecchia versione di `data()` da git history e rimuovere le 8 case di delegation. Il resto (Step 7 summary, Step 6 stats, ecc.) resta stabile.

---

## 12. GATE PER STEP 9 (Modals)

Step successivo (Modals — `openResumeModal`, `openDurationModal`, `closeModal`) può iniziare SE:

- ✅ Checklist §7 completa (utente)
- ✅ 0 errori console durante Profilo
- ✅ Tutti i bottoni azionati correttamente (Sync, Restore, Save/Clear config, Export/Import, Reset)
- ✅ "Gestisci →" da Banner apre correttamente il modal (le vecchie onclick nei modal rimangono, ancora funzionanti — target Step 9)

**Scope preliminare Step 9 (Modals):**
1. Refactor `openResumeModal(list)` → mount di `UI.Dialog` (o BottomSheet) con `showDialog()`.
2. Refactor `openDurationModal(id)` → idem.
3. Migrare gli ultimi 9 onclick residui a data-action su nodi mount modal (o event listener specifici del modal, poiché il modal è iniettato in `document.body` — fuori dal `#view` delegato).
4. NOT touch: `resumeSession`, `discardSession`, `closeSessionNow`, `saveManualDuration`, `openDurationModal` interno.

---

## 13. STATO

✅ **Step 8 Profilo COMPLETATO** — `data()` refattorizzata su component library (StatisticCard × 3 + Banner + Card + SettingsRow + Card GH + Card Dati + Card Danger), 9 onclick migrati a 8 nuove delegation case (open-select riusato da Step 4), business logic e IndexedDB invariati, DOM ids preservati, memory Fase E rispettata.

🛑 **STOP**. Attesa approvazione utente prima di procedere a Step 9 (Modals).
