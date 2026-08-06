# REDESIGN_ANALYSIS.md

**Progetto:** Fit Circuit Tracker → Fit Workout v2
**Data analisi:** 2026-08-01
**Redazione:** Senior Software Architect + Senior UX Designer + Senior Frontend Engineer
**Fonti:** [DOCS/00 → DOCS/08] (fonte della verità), codice sorgente attuale (`index.html`, `sw.js`, `manifest.json`)
**Stato:** DA APPROVARE — nessuna modifica al progetto ancora effettuata.

---

## 1. Analisi dell'architettura attuale

### 1.1 Struttura file

Il progetto è un **PWA monolitica** composta da:

| File | Righe | Descrizione |
|---|---:|---|
| [index.html](index.html) | 1483 | Tutto in un unico file: HTML markup + CSS inline (~575 righe) + JS inline (~900 righe) + JSON `EMBEDDED_SCHEDA` |
| [sw.js](sw.js) | 37 | Service Worker cache-first per asset locali |
| [manifest.json](manifest.json) | 19 | PWA manifest — theme `#7c3aed`, background `#f5f5f7`, display `standalone` |
| [icon.svg](icon.svg) | — | Icona PWA |
| [README.md](README.md) | 2 | Minimo |

**Nessuna toolchain** (no npm, no bundler, no framework, no TypeScript, no test runner).
Tutto è JavaScript vanilla ES2020+ eseguito direttamente dal browser.

### 1.2 Stato globale

Un unico oggetto `S` in [index.html:599](index.html#L599):

```js
S = {
  tab,          // 'schede' | 'workout' | 'stats' | 'data' (tab attuale)
  cards, exercises, sessions,   // proiezione delle 3 object store IndexedDB
  flow: { cardId, weekKey },    // navigazione step-by-step in "Schede"
  active,       // sessione di allenamento in corso (o null)
  timer, tick,  // rest timer + interval id
  sessionTick,  // interval id session timer
  theme,        // 'system' | 'light' | 'dark'
  missing,      // set kg mancanti al termine
  sync,         // { config, lastSyncAt, status, busy, pending, lastError }
}
```

### 1.3 Persistenza

**IndexedDB** `fit-circuit-tracker-v18-optional-day` (versione 2), object stores:

- `cards` (keyPath: `id`) — schede
- `exercises` (keyPath: `id`) — anagrafica esercizi
- `sessions` (keyPath: `id`) — sessioni di allenamento
- `settings` (keyPath: `id`) — `sync-config`, `sync-meta`

Wrapper `Store` con `open/all/get/put/del/clear` in [index.html:601](index.html#L601).

**localStorage** usato solo per `theme`.

### 1.4 Modello dati (SACRO — non modificare)

```
Card { id, name, weeks[], noteGenerali, createdAt, updatedAt }
Week { key, label, days[] }
Day  { key, label, name, blocks[] }
Block {
  id, section ('circuito'|'core'|'tabata'|'hiit'|'superserie'),
  type ('Circuit'|'Core'|'Tabata'|'HIIT'|'Superset'|'Single'),
  label, restText, restSec, rounds,
  exerciseIds[], exerciseTargets{ [exId]: { reps, target } }
}
Exercise { id, name, primary, source, createdAt, updatedAt }
Session {
  id, cardId, weekKey, dayKey,
  startedAt, endedAt, durationSec,
  exerciseLogs[], completedSets, totalVolume,
  discarded?, syncStatus, updatedAt
}
Log { blockId, exerciseId, setNo, kg, reps, done, updatedAt }
```

### 1.5 Business logic (SACRA — non modificare)

Suddivisa in blocchi funzionali all'interno di `index.html`:

- **Parsing/import scheda JSON** — `importPlan`, `parseBlocks`, `mapType`, `parseRestToSeconds`, `parseRoundsFromText`, `findOrCreateExercise` ([599-694](index.html#L599-L694))
- **Deduplica esercizi omonimi** — `migrateDedupExercises` ([696-747](index.html#L696-L747))
- **Selezione flow Scheda→Settimana→Giorno** — `schede`, `cardTile`, `weekTile`, `dayTile`, `startDay` ([749-873](index.html#L749-L873))
- **Sessione attiva** — `beginWorkout`, `persistActive` (debounce 400 ms), `saveSetLog`, `toggleExerciseSet`, `toggleRound`, `finishWorkout` ([874-978](index.html#L874-L978))
- **Timer** — session timer (aggiorna solo `#sessionTimerText`) + rest timer (aggiorna solo `#restTimerTime`) ([882, 913](index.html#L882))
- **Sessioni incomplete + resume/discard/close manual** — `checkIncompleteSessions`, `openResumeModal`, `resumeSession`, `discardSession`, `closeSessionNow`, `saveManualDuration` ([1025-1225](index.html#L1025-L1225))
- **Auto-fill kg mancanti da sessione precedente** — `fillMissingFromPrevious`, `findPreviousCompleted`, `findInLog` ([1227-1314](index.html#L1227-L1314))
- **Export locale JSON + Import** — `exportAll`, `#fileImport.onchange` ([1022, 1316](index.html#L1022))
- **GitHub Sync** — `loadSyncConfig`, `saveSyncConfig`, `clearSyncConfig`, `syncToRemote` (GET sha → PUT contents), `restoreFromRemote`, `scheduleSync` (debounce 30 s), `renderSyncStatus` ([1326-1444](index.html#L1326-L1444))
- **Bootstrap** — `Store.open` → `loadSyncConfig` → `refresh` → import scheda embedded se vuoto → `migrateDedupExercises` → `checkIncompleteSessions` → offerta ripristino ([1468-1480](index.html#L1468-L1480))

### 1.6 UI attuale — sintesi per tab

| Tab | Cosa mostra | Note |
|---|---|---|
| **Schede** | 3 sezioni verticali: elenco schede → settimane della scheda selezionata → giorni della settimana selezionata | Layout desktop-first, tutto visibile contemporaneamente |
| **Workout** | Header sticky con barra progresso + tempo, poi elenco di TUTTI i blocchi come `<details>` accordion, ognuno con lista esercizi e input kg per ogni serie | Molto denso, richiede scroll continuo — violazione totale della "Modalità Focus" |
| **Statistiche** | 2 card: workout completati, volume totale | Estremamente minimale, nessun grafico né PR |
| **Dati** | Reset, Import JSON, Export, form config GitHub sync | Funzionale ma non è un "Profilo" |

### 1.7 Rendering

- Full re-render: `render()` sostituisce `#view.innerHTML` e `#tabs.innerHTML` ad ogni cambio stato ([748](index.html#L748))
- Ottimizzazioni puntuali: `updateSessionTimerOnly` e `updateRestTimerOnly` scrivono direttamente il textContent dell'elemento per evitare re-render del timer
- Auto-persist su qualsiasi `click/change/touchend/keyup` a livello document ([1453-1455](index.html#L1453-L1455))

### 1.8 Estetica corrente

- Palette viola `#7c3aed` / `#a78bfa`, background `#f5f5f7`
- Card con `backdrop-filter: blur(18px)` + trasparenza (gia "Apple compact")
- Radius 22 px, shadow morbida
- Dark theme funzionante (via `[data-theme=dark]`)
- Font stack `system-ui/SF Pro`, **NO Inter caricato**
- Layout `max-width: 820px` con padding 10 px — è di fatto un layout desktop-ish, NON mobile-first

---

## 2. Problemi riscontrati (vs. specifica redesign)

### 2.1 Violazioni dirette dei documenti

| Documento | Regola violata | Situazione attuale |
|---|---|---|
| 00 / 02 / 06 | "Massimo 4 sezioni: Home, Workout, Progressi, Profilo" — Bottom Navigation, no tab in alto | Tab pillole in alto: Schede, Workout, Statistiche, Dati. Nessuna Bottom Nav. Nessuna Home dedicata |
| 05 (Workout Screen) | "Modalità Focus" — UN SOLO esercizio visibile | Vengono mostrati TUTTI i blocchi in accordion, con TUTTI gli esercizi e TUTTE le serie |
| 01 / 05 / 03 (WeightPicker, RepsPicker) | "Mai `<input type="number">`, usare `[-] 34 [+]`" | Kg viene inserito con `<input type="number" step=".5">` ([852](index.html#L852)). Reps non è nemmeno editabile |
| 01 / 08 P.15 | "Mai `!important`" | Usato in 6+ punti (`.active,.primary`, `.card.primary`, `.pillDone`, `.setRow.noCheck`) |
| 01 / 08 P.17 | "Mai animare `top/left/width/height`, solo `transform` e `opacity`" | Attualmente non esistono animazioni oltre `transform: scale(.99)` al tap |
| 02 / 08 P.23 | "Mai popup per informazioni — usa Toast/Banner/Bottom Sheet" | Usati `alert()` e `confirm()` per errori/conferme di ripristino GitHub ([1371, 1419, 1426, 1427, 1432, 1440, 1442, 1477](index.html#L1371)) |
| 02 / 08 P.14 | "DOM massimo 6 livelli" | `#view > .card.workoutHead > .between > div > h2/p/span` + accordion nidificato — al limite |
| 01 / 02 | "Card annidate — MAI" | `.circuitBlock > .exerciseList > .exerciseCard > .setRows > .setRow` = 4 livelli di card |
| 03 (Progress Ring) | "Mai barre nella Home. Usare Ring" | Progresso mostrato come `.bar` lineare ([797](index.html#L797)) |
| 01 / 08 P.27 | "Ogni pulsante ≥ 48 px (preferibile 56)" | Pulsanti attuali: `padding: 8px 12px; font-size: 12px` → altezza ~30-32 px |
| 01 / 08 P.34 | "Solo font Inter" | Font stack `system-ui, SF Pro, Inter, Segoe UI...` — Inter non è caricato |
| 05 (Rest Timer) | "Schermata dedicata full-screen" | Attualmente inline `.timerDock` fissa in basso |
| 02 (Fine Workout) | "Schermata dedicata post-workout: Tempo/Volume/PR/Condividi/Fine" | Al termine `go('stats')` → tab Statistiche direttamente |
| 04 (Home) | Hero, Progress Ring, Quick Stats, Ultimi Workout, PR, FAB, Bottom Nav | Non esiste una Home |
| 02 (Progressi) | Overview, Grafici, Record, Cronologia, Calendario | Non esiste, solo 2 numeri in "Statistiche" |
| 08 P.30 | "Mai ricaricare la pagina intera" | Ogni azione fa `render()` che sostituisce `#view.innerHTML` |
| 01 | "Progettare da 390 px, mobile first" | Attualmente `max-width: 820px` centrato, breakpoints regressivi (`max-width: 620px`) |

### 2.2 Debito UX (non violazioni formali ma bruciature)

- Il flusso "Scheda → Settimana → Giorno" richiede 3 tap per iniziare, ogni volta. La Home dovrebbe aprire direttamente sul workout previsto per oggi.
- Non c'è feedback visivo/haptico al completamento serie (solo checkbox si spunta).
- Non esistono skeleton di caricamento, empty state illustrati, error banner.
- Nessuna transizione di schermata: cambio tab → flash.
- Nessun swipe gesture (docs mandano swipe destra = completa, sinistra = annulla, etc.).
- Persistenza inputo kg è "on typing" ma re-render globale toglie focus dai campi — mitigato con `saveSetLogKeepFocus` ma la UX vive di piccoli glitch.

### 2.3 Bug/quirk minori identificati

- `blockRoundDone` restituisce true solo se TUTTI gli esercizi del block sono `done` a quella serie — corretto, ma round chip `G1/G2/G3` è controllato solo da `done` dei log, quindi il primo esercizio non spuntato blocca la round chip → OK, funziona.
- Nel dark theme il `.exerciseCard`/`.setRow` mantengono `background: rgba(255,255,255,.55/.72)` — leggermente stonati ma non un bug funzionale.
- Il commento inline in [index.html:1050](index.html#L1050) `"se ce ne e gia una attiva"` senza apostrofo, apostrofi tipografici assenti — la UI stringa in italiano ha inconsistenze accentate.
- L'auto-persist con listener globale `capture` gira anche su interazioni fuori dal workout — costo trascurabile ma inelegante.

---

## 3. Debito tecnico

| Area | Debito | Impatto sul redesign |
|---|---|---|
| **Architettura file** | Tutto in un file da 1483 righe: CSS/JS/HTML/dataset mescolati | Alto — impossibile mantenere un component library senza almeno separare CSS/JS. Proposta: 3 file (index.html + app.js + styles.css) senza toolchain, oppure restare monolitico ma con sezioni marcate. **Domanda in §10.** |
| **Rendering** | `innerHTML` full replace su ogni interazione | Alto — impedisce animazioni di enter/leave, transizioni schermata, e rende impossibile mantenere focus/scroll durante update parziali. Serve un mini-router con render per-screen e mount/unmount |
| **Handler inline `onclick=""`** | Ovunque nei template letterali (`onclick="startDay('${cardId}',...)"`) | Medio — funzionale, ma sporca globals e fragile con `esc`. Da mantenere per parità o migrare a event delegation |
| **CSS globals** | Selectors generici (`button`, `input`), poi override tramite classe | Medio — servono design tokens formalizzati in `:root` con nomi semantici (`--space-16`, `--color-primary`) sostituendo le variabili attuali |
| **`!important` diffusi** | 6+ occorrenze | Basso — vanno rimossi con specificity corretta |
| **Nessun test / lint / build** | Zero automazione | Basso — accettabile per app personale, ma difficile validare regressioni |
| **Codice minified/one-liner** | Molte funzioni compresse in una riga (es. `render`, `Store` object, `S` initializer) | Basso — leggibile, ma va riformattato dove si tocca |
| **Duplicazione parsing** | `parseRestToSeconds` chiamato sia durante import sia in `startRestTimer` come fallback | Basso — ridondanza voluta per resilienza |
| **Naming italiano/inglese misto** | `schede`, `workout`, `stats`, `data` + `Card`, `Week`, `Day`, `Block` | Basso — cosmetico. Mantenere per non rompere IndexedDB |

---

## 4. Componenti/logica riutilizzabile (KEEP)

**Tutto il layer business è da preservare integralmente.** Elenco esplicito:

### 4.1 Logica business (nessun cambio funzionale)

- `Store` (wrapper IndexedDB)
- `applyTheme`, gestione tema
- `importPlan`, `parseBlocks`, `mapType`, `parseRestToSeconds`, `parseRoundsFromText`, `findOrCreateExercise`, `label`
- `migrateDedupExercises`
- `resolveSessionCard`, `ctx`, `logFor`, `lastExerciseLog`, `maxExerciseKg`, `buildKgPlaceholder`
- `startDay`, `beginWorkout`, `startSessionTimer`, `stopSessionTimer`, `sessionTime`, `updateSessionTimerOnly`
- `saveSetLog`, `saveSetLogKeepFocus`, `saveBlockInputs`, `saveAllActiveInputs`, `persistActive`
- `toggleExerciseSet`, `toggleRound`, `blockAllDone`, `blockRoundDone`, `totalSetCount`, `doneSetCount`
- `startRestTimer`, `stopRestTimer`, `updateRestTimerOnly`, `formatSec`
- `finishWorkout`, `repsNumber`
- `incompleteSessions`, `fmtElapsed`, `sessionLabel`, `checkIncompleteSessions`, `resumeSession`, `discardSession`, `closeSessionNow`
- `openDurationModal`, `saveManualDuration` (UI da riscrivere, comportamento da preservare)
- `findPreviousCompleted`, `findInLog`, `fillMissingFromPrevious`
- `exportAll`, handler `#fileImport`
- `loadSyncConfig`, `saveSyncConfig`, `clearSyncConfig`, `scheduleSync`, `syncToRemote`, `restoreFromRemote`, `renderSyncStatus`
- Autosave listeners: `click/change/touchend/keyup`, `visibilitychange`, `beforeunload`
- Bootstrap IIFE finale

### 4.2 Infrastruttura da preservare

- `manifest.json` — aggiornare solo `theme_color` (→ `#6D5DF6`) e `background_color` (→ `#0B0D10`), lasciare stessa `scope`/`start_url` per non invalidare install
- `sw.js` — logica cache-first va bene; **bumperemo la `CACHE` version** (`fit-tracker-v1` → `v2`) per forzare invalidazione al deploy locale
- `icon.svg` — valutare se rifare per allinearla al brand nuovo, ma non bloccante
- `EMBEDDED_SCHEDA` — resta identico, fonte fallback quando IndexedDB è vuoto
- `DB` name `fit-circuit-tracker-v18-optional-day` — **NON toccare** (invaliderebbe tutte le sessioni salvate)

### 4.3 Design decisioni da conservare per continuità

- Backdrop-filter blur (già coerente con "Glass Effect" docs 01)
- Dark theme via `[data-theme]` attribute + CSS custom properties (approccio già corretto)
- Persistenza tema in `localStorage.theme`
- Debounce autosave 400 ms + immediato su visibilitychange/beforeunload
- Debounce sync GitHub 30 s

---

## 5. Componenti da sostituire (REPLACE) / creare (NEW)

### 5.1 Da rimuovere completamente

- Layout tab in alto (`#tabs` + pillole)
- Renderer `schede()` (flusso Scheda → Settimana → Giorno visibile insieme) → sostituito da: Home fa auto-select + "Cambia scheda" in Profilo
- Renderer `workout()` accordion di tutti i blocchi → sostituito da Workout Focus (1 esercizio, 1 azione)
- Renderer `stats()` (2 card banali) → sostituito da schermata Progressi completa
- Renderer `data()` (Dati) → spostato dentro Profilo
- `.timerDock` fisso → sostituito da FloatingTimer piccolo (bottom-right) + Timer Fullscreen dedicato
- Modal `alert/confirm` per sync → sostituiti da Bottom Sheet + Toast
- `<input type="number">` per kg → sostituito da `WeightPicker` (`[-] 34 [+]` con long-press)
- Layout `max-width: 820px` centrato → sostituito da layout mobile-first fluido (max ~430px per la card content, poi break responsive)

### 5.2 Nuovi componenti da creare (secondo `03_COMPONENT_LIBRARY.md`)

Tutti i 30 componenti della library. Prioritari per il redesign:

1. **BottomNavigation** — Home / Workout / Progressi / Profilo, blur, 4 icone, altezza 80-84 px
2. **HeroCard** — Home, workout del giorno + Progress Ring + CTA "Continua"
3. **ProgressRing** — SVG animato con gradient
4. **PrimaryButton / SecondaryButton / GhostButton / DangerButton** — 56-60 px, radius 18
5. **FloatingActionButton (FAB)** — 64 px circle, bottom-right
6. **StatisticCard** — Home Quick Stats (icona + valore + label)
7. **HistoryCard / WorkoutCard** — riga cronologia
8. **PersonalRecordCard** — Card gradient oro + badge "NEW PR"
9. **ExerciseCard** (Focus) — quasi full-screen, nome + muscolo + ultimo peso + target + PR (+GIF opzionale, ma non abbiamo GIF → illustrazione/placeholder)
10. **WeightPicker / RepsPicker** — `[-] N [+]`, long-press = incremento continuo, step 0.5/1/2.5
11. **CompleteButton** — sempre in basso, gradient primary, 64 px
12. **NextExerciseHint** — micro riga "Prossimo → ..."
13. **FloatingTimer** — piccolo pill bottom-right, tap → apre RestTimer full
14. **RestTimer (Fullscreen)** — cerchio grande, +15 sec, Salta
15. **WorkoutHeader** — sticky, back, titolo, sessionTimer, progress ring 64 px, "X" esci
16. **BottomSheet** — radius 32, blur, drag indicator, snap 40/70/100%
17. **Dialog** — max 2 CTA, sostituisce confirm()
18. **Toast** — bottom floating, 2 sec, per feedback ("Salvato", "PR nuovo", errore sync...)
19. **SegmentedControl** — es. periodo statistiche
20. **ChartCard** (Line/Area/Bar) — grafico progresso peso/volume
21. **CalendarHeatmap** — allenamenti nel mese (stile GitHub, 4 livelli)
22. **ProfileHeader** — avatar + nome + streak + peso (nota: dati non esistono ancora, vedi §10 domande)
23. **AchievementBadge** — cerchio 64 px, per PR
24. **EmptyState** — illustrazione + titolo + descrizione + CTA
25. **LoadingSkeleton** — shimmer 1.2 s loop
26. **QuickAction** — piccole card (opz.)
27. **SearchBar** — per filtri cronologia (opz.)
28. **SelectSheet** — per selezione scheda / settimana quando servisse

### 5.3 Nuove schermate

| Nome | Sostituisce | Fonte |
|---|---|---|
| **Home** | (non esisteva) | `04_HOME_SCREEN.md` |
| **WorkoutFocus** | tab Workout attuale | `05_WORKOUT_SCREEN.md` |
| **RestTimerFullscreen** | `.timerDock` | `02` + `05` |
| **WorkoutSummary** (Fine Workout) | (redirect a stats) | `02_INFORMATION_ARCHITECTURE.md` |
| **Progressi** | tab Statistiche | `02` |
| **Cronologia** (dentro Progressi) | (non esisteva) | `02` |
| **DettaglioWorkout** | (non esisteva) | `02` |
| **DettaglioEsercizio** | (non esisteva) | `02` |
| **Profilo** | tab Dati | `02` |
| **SelezioneSchedaSheet** | tab Schede | Bottom Sheet dentro Profilo/Home |

### 5.4 Nuovi calcoli/derivazioni (pure, senza modificare dati)

Da aggiungere come funzioni pure che leggono `S.sessions`:

- `computeStreak()` — giorni consecutivi con almeno 1 sessione conclusa non `discarded`
- `computeThisWeekVolume()` / `computeMonthWorkoutCount()`
- `computeAverageSessionMinutes()`
- `computePersonalRecords()` — max kg per esercizio, con data
- `computeLastPersonalRecord()` — PR piu recente per Home
- `computeExerciseHistory(exerciseId)` — timeline peso per grafico
- `computeCalendarHeatmap(monthStart, monthEnd)` — mappa data → volume
- `computeTodayWorkout()` — quale `{card, week, day}` proporre in Home:
  - se esiste sessione attiva → quella
  - altrimenti: giorno della settimana corrente ↔ `DAY_ORDER` (lunedi/mercoledi/venerdi/giorno_3_opzionale) sulla scheda + settimana attualmente selezionate in `S.flow`
  - se nulla è selezionato: prima scheda + settimana A + primo giorno
  - **DOMANDA aperta in §10 sull'automazione**

Nessuna di queste tocca IndexedDB.

---

## 6. Rischi

| # | Rischio | Probabilità | Impatto | Mitigazione |
|---|---|:-:|:-:|---|
| R1 | `innerHTML` full-replace incompatibile con animazioni schermata | Alta | Alto | Passare a **screen-based render**: ogni schermata è una funzione `render{Home,Workout,...}()` che produce HTML, l'app mantiene un mini-router che confronta screen precedente/nuovo, e applica classi `enter-from-right/enter-from-left`. Componenti "hot" (timer, picker) fanno DOM update mirati, non re-render della schermata |
| R2 | Perdita focus su input durante scroll/render | Media | Medio | Rimosso a monte: i picker sono `[-] N [+]`, non input. Per i pochi input restanti (Profilo, form GitHub) applicare la stessa tecnica di `saveSetLogKeepFocus` |
| R3 | Rottura sessioni salvate cambiando il DB name/schema | Bassa | Critico | **Non toccare** `DB = 'fit-circuit-tracker-v18-optional-day'` né gli object store. Regola in [`08_AI_RULES.md`] PRINCIPI 44/45. Aggiungiamo un test manuale post-migrazione ("apri l'app, riprendi sessione salvata, verifica dati intatti") |
| R4 | Modalità Focus richiede una nozione di "esercizio corrente" che oggi non esiste — la logica attuale è "free-form: user tap dove vuole" | Alta | Alto | Introdurre un puntatore **derivato** (non persistito) `currentBlockIndex/currentExerciseIndex/currentSetIndex` calcolato dai log: prima serie non completata. L'utente resta libero di scrollare all'indietro/avanti tramite swipe o header. **Domanda su enforcement in §10.** |
| R5 | Perdita di gestione superserie/circuiti (l'attuale UI mostra tutti insieme) | Media | Medio | Nella Focus screen mostrare `label` del circuito nell'header e usare progress ring per farlo capire ("Ex 2/3 del Circuito 1 · Round 2/3"). Nessuna modifica dati |
| R6 | Ripristino GitHub distruttivo tramite `confirm()` — se sostituito con Bottom Sheet serve controllo esplicito | Bassa | Alto | Il nuovo dialog userà **doppia conferma** (input "SI" o tap tenuto lungo) per operazioni distruttive. Comportamento invariato |
| R7 | Font Inter online-first vs offline | Media | Basso | Usare Inter self-hosted (variable font `.woff2`) inline nella cache del SW. Fallback su `system-ui` senza flash |
| R8 | Icone: attualmente nessuna libreria. Lucide via CDN aggiunge dipendenza | Media | Basso | Usare **SVG inline** dei pochi glifi Lucide che ci servono (~15 icone), niente CDN. Docs 01 dice "Lucide": lo interpretiamo come "usa quel set stilistico", non come "importa la libreria" |
| R9 | Bundle grow: HTML monolitico gia 84KB, con Inter + più CSS/JS → 200-300KB | Media | Basso | Accettabile per PWA offline-first. SW cache singola |
| R10 | Regressione: dopo il redesign una sessione in corso deve poter continuare invariata | Alta | Critico | Fare la migrazione **screen-by-screen**, mai big-bang. Ogni step deve superare la checklist di [`08_AI_RULES.md`]. Prima screen redesignata = Home (nuova, non tocca workout). Ultima = Workout Focus, con test manuale su una sessione reale in corso |
| R11 | `alert/confirm` sono bloccanti; le loro sostituzioni async cambiano il control flow | Media | Medio | Implementare `dialog.confirm(...)` come `Promise<boolean>`. Refactor puntuale dei chiamanti (`clearSyncConfig`, `restoreFromRemote`, offerta ripristino bootstrap) |
| R12 | Design token conflict con vecchie var (`--pri`, `--bg`, `--card`) usate ancora nel CSS | Bassa | Basso | Mappare 1:1 al primo commit (alias) poi rimuovere gradualmente |
| R13 | Vibration API non supportata su iOS Safari (`navigator.vibrate`) | Certa | Basso | Solo Android. Documenti dicono "se disponibile" → OK, feature-detect |

---

## 7. Piano dettagliato di implementazione

Segue la roadmap di `06_MASTER_PROMPT.md` / `07_IMPLEMENTATION_ROADMAP.md`, adattata alla natura monolitica del codice attuale.

### FASE A — Fondazioni (invisibili all'utente, no logica business)

**Step 1. Struttura file & separazione**
- Separare `index.html` in 3 file: `index.html` (shell + `<link>`+`<script>`) + `styles.css` + `app.js`
- Aggiungere `assets/fonts/inter-var.woff2` (self-hosted), preload font
- Aggiungere `assets/icons/*.svg` (~15 glifi Lucide inline)
- Bumpare `CACHE` in `sw.js` da `v1` a `v2`, aggiornare `ASSETS` per includere i nuovi file
- Aggiornare `manifest.json`: `theme_color` `#6D5DF6`, `background_color` `#0B0D10`
- **Verifica:** app funziona identica a prima, install PWA funziona, offline funziona

**Step 2. Design tokens**
- In `styles.css` definire `:root` con tutte le variabili del Design System (`01_DESIGN_SYSTEM.md`)
- Alias temporanei: `--pri: var(--color-primary)` per non rompere CSS legacy
- Font Inter caricato
- **Verifica:** l'app appare uguale; solo i tokens sono cambiati sotto

**Step 3. Router SPA**
- Introdurre `Router` con schermate: `home`, `workout`, `progressi`, `profilo` + sub-screens `restTimer`, `workoutSummary`, `dettaglioWorkout`, `dettaglioEsercizio`
- `Router.go(name, params)` monta la schermata target, chiama `onLeave` dell'attuale, applica transizione CSS (`.screen.enter` / `.screen.leave`)
- Mantenere `S.tab` come alias di `Router.current` per compat interna
- Autosave listeners **invariati**
- **Verifica:** navigazione tra 4 sezioni funzionante anche se le 4 sezioni sono ancora placeholder

**Step 4. Bottom Navigation**
- Componente `BottomNavigation` (fixed bottom, blur, 84 px, safe-area)
- Rimuovere `#tabs` top
- **Verifica:** navigazione via BottomNav; tab attiva evidenziata con gradient

### FASE B — Home & Fondamenta UI

**Step 5. Home screen**
- Layout completo secondo `04_HOME_SCREEN.md`:
  - Header (saluto + data + avatar placeholder)
  - HeroCard con Progress Ring + workout del giorno + CTA "Continua/Inizia"
  - QuickStats grid 2×2 (streak, volume mese, tempo medio, workout mese)
  - Ultimi 3 workout (HistoryCard mini)
  - Ultimo PR (PersonalRecordCard mini)
  - FAB "+" per nuovo workout
- Funzioni derivazione: `computeStreak`, `computeMonthVolume`, `computeAverageSessionMinutes`, `computeMonthWorkoutCount`, `computeLastPersonalRecord`, `computeTodayWorkout`
- **Verifica:** dati corretti (spot check su 1-2 sessioni), tap CTA porta in Workout, tap FAB apre Sheet selezione scheda

**Step 6. Selezione scheda/settimana/giorno (Bottom Sheet)**
- Ripristina la logica di `schede()` come Bottom Sheet a tre step (Scheda → Settimana → Giorno) — invocato da:
  - FAB Home
  - "Cambia scheda" nel Profilo
- Mantiene `startDay(cardId, weekKey, dayKey)`
- **Verifica:** flusso "nuovo workout" completo, apre Workout Focus

### FASE C — Workout Focus (parte critica)

**Step 7. Workout Header + Progress Ring**
- Nuovo header sticky con: back → Home, titolo scheda/giorno, session timer, progress ring 64 px, X esci
- Uso derivazioni `totalSetCount(blocks)` / `doneSetCount()` esistenti
- **Verifica:** header mostra tempo corretto, ring si aggiorna quando cambia log

**Step 8. Workout Focus screen (single exercise)**
- Puntatore corrente `currentBlockIdx/currentExerciseIdx/currentSetIdx` calcolato da log (prima serie non `done`)
- ExerciseCard: nome + muscolo + ultimo peso (via `lastExerciseLog`) + target reps + PR (via `maxExerciseKg`) + placeholder immagine
- Sotto: WeightPicker (`[-] N [+]`, long-press = ripetizione, tap = step 0.5) + valore in evidenza (40 px, weight 900)
- CompleteButton "Completa Serie" (gradient primary, 64 px, sempre in basso — pollice)
- NextExerciseHint sopra bottone
- Swipe destra = completa (chiama `toggleExerciseSet` con `checked=true`), swipe sinistra = annulla
- Post-complete: animazione check + vibrazione (se disponibile) + auto-start rest timer
- **Il pattern differisce a seconda del `block.type`:**
  - `Circuit/Superset/Core/Tabata/HIIT`: dopo Completa → prossimo esercizio del round; a fine round → RestTimer
  - `Single`: dopo Completa → RestTimer, poi stesso esercizio setNo+1
- Long-press sull'ExerciseCard → BottomSheet dettaglio esercizio (storico, grafico, PR)
- **Verifica critica:** completare una sessione end-to-end senza toccare il codice business. Confrontare `S.active.exerciseLogs` prima/dopo con lo stato che produceva la UI vecchia — deve essere identico

**Step 9. Rest Timer fullscreen**
- Nuova schermata dedicata: cerchio grande, numero enorme, "+15", "Salta", label prossimo esercizio
- Attivata automaticamente al completamento serie/round
- Tap fuori dal ring → torna a Workout Focus (timer continua in background come `FloatingTimer` piccolo bottom-right)
- Skip → chiude timer, torna a Workout Focus con prossimo esercizio già settato
- Usa `startRestTimer/stopRestTimer` esistenti
- **Verifica:** timer scende, si chiude a 0, avanza esercizio; +15 aggiunge 15 sec; skip chiude subito

**Step 10. Workout Summary (fine workout)**
- Sostituisce il salto a `stats` in `finishWorkout()`
- Schermata: "Workout terminato" + tempo totale + volume + PR raggiunti (calcolare confronto pre/post) + condividi + Fine
- Condividi: prova `navigator.share({ title, text })`, fallback = copia testo
- Fine → torna a Home
- Se `finishWorkout()` rileva serie mancanti (`missing.length`), invece di rimanere nella vecchia UI mostra un BottomSheet "Serie senza kg: [lista]" con CTA "Riprendi" (torna a Focus sul primo mancante) o "Chiudi comunque" (svuota missing e conclude)
- **Verifica:** sessione completa → Summary corretto; sessione incompleta → BottomSheet, l'utente puo scegliere

### FASE D — Progressi

**Step 11. Progressi overview**
- SegmentedControl: Overview / Grafici / Record / Cronologia / Calendario
- Overview: 4 grandi statistiche (workout totali, volume totale, PR totali, streak record) + mini chart ultimi 7 giorni
- **Verifica:** numeri coerenti con dati reali

**Step 12. Grafici**
- ChartCard usando SVG puro (line/area chart) — no dipendenze
- Tab: peso per esercizio (selezione con SearchBar/SelectSheet), volume settimanale, tempo medio
- **Verifica:** grafici renderizzano, tap punto → tooltip

**Step 13. Record**
- Elenco PersonalRecordCard, ordinati per data
- Badge "NEW" per PR ultimi 7 giorni
- **Verifica:** ordinamento + rilevamento nuovi

**Step 14. Cronologia**
- HistoryCard verticali raggruppate per settimana ("Questa settimana", "Settimana scorsa", "N settimane fa")
- Tap → DettaglioWorkout screen
- **Verifica:** ordinamento reverse-chronological, dettaglio apre

**Step 15. Calendario heatmap**
- Grid 7×5 tipo GitHub, 4 livelli di intensità basati sul volume del giorno
- Tap giorno con workout → apre DettaglioWorkout

### FASE E — Profilo & migrazione modali

**Step 16. Profilo screen**
- ProfileHeader (avatar iniziali "FT" + nome default + streak + peso corporeo *)
- Sezione Preferenze: tema (system/dark/light SegmentedControl)
- Sezione Backup: sposta qui il form GitHub Sync (invariata la logica)
- Sezione Dati: Import JSON, Export JSON, Reset scheda (con Dialog conferma)
- \* Dato peso corporeo non esiste oggi: **domanda in §10** su come gestirlo
- **Verifica:** tutte le operazioni di Dati funzionano come prima

**Step 17. Sostituzione alert/confirm**
- Introdurre `Dialog.confirm(opts): Promise<boolean>`, `Toast.show(msg, type)`, `Sheet.open(...)`
- Refactor puntuale:
  - `clearSyncConfig` — Dialog conferma
  - `restoreFromRemote` — Dialog "sovrascriverà i dati locali. Continuare?" + Toast successo/errore
  - bootstrap "Nessuna sessione locale…" → Dialog non-bloccante
  - `saveSyncConfig` alert compila token → Toast warning
- **Verifica:** nessun `alert()`/`confirm()` residuo in codice

**Step 18. Resume incomplete session sheet**
- Trasformare `openResumeModal` in `BottomSheet` con lista sessioni + azioni (Riprendi / Scarta / Chiudi ora / Chiudi a mano)
- `openDurationModal` → BottomSheet con picker ore/minuti (`[-] N [+]`, non `<input type=number>`)
- **Verifica:** al riavvio dell'app con sessione aperta, sheet appare; azioni preservano il comportamento

### FASE F — Polish

**Step 19. Loading & Empty states**
- Skeleton per Home, Progressi durante `Store.open`
- EmptyState illustrato per: nessuna sessione, nessun PR, calendario vuoto
- **Verifica:** primo avvio, o Reset → empty states corretti

**Step 20. Animazioni**
- Enter/leave transitions tra screen (slide + fade, 220 ms cubic-bezier)
- Feedback tap (scale 0.97 + glow) globale sui componenti tap-target
- ProgressRing animato con `stroke-dashoffset` transition
- Skeleton shimmer 1.2 s loop
- **Verifica:** 60 FPS su Chrome DevTools Performance, no jank

**Step 21. Accessibilità & responsive**
- Contrasto WCAG AA verificato per tutti i colori
- `role`/`aria-*` sui componenti interattivi
- `prefers-reduced-motion` → disabilita animazioni non essenziali
- Test su viewport 390/430/768/1024/1440
- Safe area `env(safe-area-inset-*)` per BottomNav / FAB / Timer
- **Verifica:** Lighthouse Accessibility > 95

**Step 22. Rimozione debito CSS legacy**
- Rimuovere alias `--pri: var(--color-primary)` e tutti i selettori CSS non piu usati
- Rimuovere `!important` residui
- **Verifica:** cerca `!important` → 0 risultati (fatte salve eventuali override necessari per librerie esterne, che qui non ci sono)

**Step 23. Bump SW cache & finali**
- `CACHE` `v2` → `v3` per invalidare cache utente al primo caricamento della versione finale
- Aggiornare `README.md` (opzionale) con nota versione
- **Verifica finale:** checklist completa di `08_AI_RULES.md`

---

## 8. Sequenza dei commit consigliata

Ogni commit deve essere: **compilabile, funzionante, senza regressioni, testabile a mano.**

*(Commit locali; nessun push senza autorizzazione esplicita.)*

| # | Commit message | File toccati | Rischio |
|--:|---|---|:-:|
| 1 | `chore: split monolithic index.html into shell + styles.css + app.js` | index.html, styles.css (new), app.js (new), sw.js | Basso |
| 2 | `feat(theme): add design tokens and Inter font, keep legacy aliases` | styles.css, /assets/fonts | Basso |
| 3 | `feat(icons): inline SVG icon set (lucide subset)` | app.js (icon helper), styles.css | Basso |
| 4 | `feat(router): screen-based SPA router with transitions` | app.js | Medio |
| 5 | `feat(nav): BottomNavigation replaces top tabs` | app.js, styles.css | Medio |
| 6 | `feat(home): Home screen (Hero, QuickStats, Recents, PR, FAB)` | app.js, styles.css | Medio |
| 7 | `feat(sheet): BottomSheet + Dialog + Toast primitives` | app.js, styles.css | Basso |
| 8 | `feat(sheet): scheda/settimana/giorno selection sheet from FAB` | app.js | Medio |
| 9 | `feat(workout): WorkoutHeader with sticky progress ring & session timer` | app.js, styles.css | Medio |
| 10 | `feat(workout): Focus screen (single exercise + WeightPicker + Complete)` | app.js, styles.css | **Alto** |
| 11 | `feat(workout): swipe gestures + haptic feedback` | app.js | Medio |
| 12 | `feat(timer): fullscreen RestTimer + FloatingTimer` | app.js, styles.css | Medio |
| 13 | `feat(summary): WorkoutSummary screen after finish` | app.js | Medio |
| 14 | `feat(summary): missing sets bottom sheet on finish` | app.js | Medio |
| 15 | `feat(progressi): overview + grafico SVG` | app.js | Medio |
| 16 | `feat(progressi): records list` | app.js | Basso |
| 17 | `feat(progressi): history timeline + workout detail` | app.js | Medio |
| 18 | `feat(progressi): calendar heatmap` | app.js | Basso |
| 19 | `feat(profilo): profile screen with theme + backup + data ops` | app.js | Medio |
| 20 | `refactor(dialogs): replace alert/confirm with Dialog/Toast` | app.js | Medio |
| 21 | `refactor(resume): incomplete sessions moved to BottomSheet` | app.js | Medio |
| 22 | `feat(states): loading skeletons + empty states + error banner` | app.js, styles.css | Basso |
| 23 | `feat(motion): enter/leave transitions, ProgressRing anim, feedback taps` | app.js, styles.css | Basso |
| 24 | `feat(a11y): aria, contrast, reduced-motion, safe-area, breakpoints` | app.js, styles.css | Basso |
| 25 | `chore(css): drop legacy aliases and !important` | styles.css | Basso |
| 26 | `chore(sw): bump cache version, refresh manifest colors` | sw.js, manifest.json | Basso |

Numero commit: **~26**. Ogni commit ≤ 250 righe diff ove possibile.

---

## 9. Stima della complessità

| Fase | Effort relativo | Commit | Note |
|---|:-:|:-:|---|
| A — Fondazioni | S | 1-4 | Refactor tecnico, no UX visibile |
| B — Home + Sheet selezione | M | 5-8 | Prima UX nuova visibile |
| C — Workout Focus | **XL** | 9-14 | Cuore del redesign, richiede test manuali estensivi |
| D — Progressi | M | 15-18 | Molto rendering, poca logica |
| E — Profilo & modali | M | 19-21 | Toccare `alert/confirm` in punti critici (restore GitHub) |
| F — Polish | S/M | 22-26 | Iterativo |

Complessità totale stimata (indicativa, non tempo): **XL su ~1 mese di lavoro a ritmo sostenibile**, con dei checkpoint alla fine di ogni fase.

**Punti di attenzione massima:**
- Commit 10 (Workout Focus) — è dove piu facilmente puoi rompere qualcosa. Prima di iniziarlo, faremmo un dry-run manuale della sessione tipo salvando lo screen `S.active` in JSON per confrontarlo dopo.
- Commit 20 (Dialog/Toast al posto di alert/confirm) — cambia il control flow da sincrono ad asincrono. Necessario mantenere l'ordine "conferma → operazione" originale.

---

## 10. Domande / dubbi da chiarire prima dell'implementazione

Ti chiedo di rispondere prima che io inizi. Alcune hanno un'impostazione di default che consiglio; se non rispondi assumo la default marcata `[DEFAULT]`.

**Q1 — Architettura file:** Preferisci che continui a mantenere tutto in un unico `index.html`, oppure lo separi in `index.html` + `styles.css` + `app.js`?
- `[DEFAULT]` **Separazione in 3 file**, senza toolchain (nessun npm, nessun build)
- Alternativa: monolitico com'è ora

**Q2 — Modalità Focus, ordine esercizi:** Nel Workout Focus l'utente deve seguire l'ordine (ex1 → ex2 → ex3 → round successivo) o puo saltare liberamente?
- `[DEFAULT]` **Ordine suggerito** (l'app avanza automaticamente al prossimo non completato) ma **swipe up/down** permette di scorrere manualmente esercizi/serie
- Alternativa 1: enforcement rigido
- Alternativa 2: completamente libero (come ora)

**Q3 — Home "Workout del giorno":** Quando apri la Home, quale workout mostra?
- `[DEFAULT]` **Priorità**: (a) sessione attiva, altrimenti (b) giorno della settimana corrente sulla scheda/settimana selezionata l'ultima volta, altrimenti (c) primo giorno del primo settimana della prima scheda
- Alternativa: sempre ultima scheda usata + selezione manuale del giorno

**Q4 — Profilo (dati mancanti):** I doc menzionano avatar, nome, livello, streak, peso corporeo. Oggi non esistono nel modello dati.
- `[DEFAULT]` **Non introdurre nuovi campi persistenti.** Profilo mostra iniziali "FT", nome fisso "Atleta", streak calcolato dalle sessioni, peso corporeo non mostrato
- Alternativa: aggiungo un piccolo store `profile` in IndexedDB con nome/peso (richiederebbe uno step migrate)

**Q5 — Font Inter:** self-hosted o Google Fonts CDN?
- `[DEFAULT]` **Self-hosted** (`.woff2` variable, ~85 KB) per garantire offline e performance
- Alternativa: CDN

**Q6 — Icone Lucide:** libreria completa o solo SVG inline dei ~15 glifi che servono?
- `[DEFAULT]` **SVG inline** (~5 KB), zero dipendenze
- Alternativa: import da CDN Lucide

**Q7 — Step WeightPicker:** i doc citano 0.5 / 1 / 2.5 / 5 kg. Comportamento del picker?
- `[DEFAULT]` **Tap = ±0.5 kg** (piu comune in palestra), **long-press = ripetizione veloce che accelera** (+0.5, poi +1, poi +2.5)
- Alternativa: mini SegmentedControl per selezionare lo step

**Q8 — RepsPicker:** oggi il campo `reps` del log non è mai stato editato dall'utente (l'input HTML c'era solo per il kg, `reps` restava sempre stringa vuota nei log — ma `repsNumber(l.reps)` viene usato in `totalVolume`). Cosa vuoi?
- `[DEFAULT]` **Introdurre RepsPicker** e salvarlo nel log; per sessioni vecchie senza reps `totalVolume` resta com'è (0 se non ci sono reps). Il target reps della scheda (es. "12-15") resta come `targetRep` sopra il picker.
- Alternativa: lasciare reps vuoto come oggi (perdiamo la funzione picker che i doc chiedono)

**Q9 — Vibrazione:** OK usare `navigator.vibrate([10])` su Android? (Ignorato su iOS.)
- `[DEFAULT]` **Sì**, feature-detect + rispetto `prefers-reduced-motion`

**Q10 — Test:** vuoi che aggiunga uno stub di test manuali (checklist `.md`) o smoke automatici in un file `test.html`?
- `[DEFAULT]` **Checklist manuale** in `TESTING.md`, senza framework
- Alternativa: nessun test formalizzato

**Q11 — Backup GitHub in Profilo:** l'attuale form ha 5 campi (owner, repo, path, branch, token). Redesign strict = campi input non a numero. Mantengo la forma libera per queste stringhe (nome utente, repo, ecc.)? Sono stringhe, non numeri — la regola docs riguarda i numeri.
- `[DEFAULT]` **Sì**, campi testo restano input testuali (con `type=password` per token), non ci sono alternative sensate

**Q12 — Riduzione features:** il redesign parla di sezioni ricche (Obiettivi, Achievement, condividi workout). Alcune sono nuove funzioni, non solo UI.
- `[DEFAULT]` **Includo solo le derivazioni possibili dai dati esistenti** (streak, PR, volume, tempo, calendario). Achievement/obiettivi/condividi puri di UX: gli achievement li mostro solo se ho un dato reale (es. "1° PR", "5 workout consecutivi"). Condividi userà `navigator.share` con fallback copia
- Alternativa: escludere completamente Achievement/Obiettivi finché non c'è un modello dati

**Q13 — Rimozione tab "Dati":** ok se sposto tutto in Profilo? Perde la scoperta rapida ma è ciò che i doc chiedono ("massimo 4 sezioni, tutto secondario deve stare dietro").
- `[DEFAULT]` **Sì**, sposto in Profilo con sezioni chiaramente etichettate

**Q14 — Comportamento GitHub sync durante workout attivo:** oggi `scheduleSync` debounce 30 s parte dopo ogni `persistActive`. Continua a girare in background durante il Focus workout?
- `[DEFAULT]` **Sì, invariato** — è business logic

**Q15 — Illustrazione ExerciseCard:** i doc citano GIF autoplay. Non abbiamo asset.
- `[DEFAULT]` **Placeholder SVG** neutro con l'icona del muscolo target. Non introduco fetch di GIF da servizi esterni

**Q16 — Bump nome DB IndexedDB:** rimane `fit-circuit-tracker-v18-optional-day`?
- `[DEFAULT]` **Sì, invariato**, altrimenti si perdono le sessioni. Le regole 44/45 di `08_AI_RULES.md` sono esplicite

**Q17 — Fase pre-commit di ogni step:** vuoi che ti mostri il diff prima di ogni commit locale, o commit sequenziali dopo il tuo GO iniziale?
- `[DEFAULT]` **Ti mostro un riepilogo di ogni commit (file toccati + descrizione)** al termine, TU decidi se procedere allo step successivo. Nessun `git push` senza autorizzazione, come da tua regola persistita

---

## Conclusione

Nessuna modifica al codice è stata effettuata. In attesa della tua conferma per procedere.

Se accetti i default marcati `[DEFAULT]` alle 17 domande, procederò partendo dal **commit #1 (Step 1 — split file)**.
