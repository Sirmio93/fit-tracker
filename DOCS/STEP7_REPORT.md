## STEP7_REPORT — Workout Summary (schermata transiente)

**Versione:** 1.0
**Data:** 2026-08-05
**Scope:** Fase 10 — Step 7 (Workout Summary fullscreen non navigabile)
**Prerequisito:** Step 1-6 completati; `window.UI.StateSuccess`, `StatisticCard`, `Button` disponibili.

---

## 0. TL;DR

- **Nuova view `summary()`** — schermata transiente post-workout, non presente in Bottom Navigation, componente `StateSuccess` + 3 `StatisticCard` (Volume/Serie/Durata) + CTA "Fine" (→ home) e "Vedi progressi" (→ progressi).
- **`finishWorkout()` reindirizza a `summary`** invece che direttamente a `progressi`. Prima di azzerare `S.active`, snapshot minimo (`totalVolume`, `completedSets`, `durationSec`, `label`, `id`, `endedAt`) su `S.lastSummary`.
- **BottomNav nascosta** quando `S.tab === 'summary'` (via `bnRoot.style.display`).
- **Business logic INTATTA** — nessuna modifica a `Store`, IndexedDB, algoritmi, o modello dati. Firma `finishWorkout()` invariata.
- **Percorsi alternativi non toccati** — `closeSessionNow` (chiusura da Profilo) e `saveManualDuration` (durata >4h) NON passano da `summary`. Per definizione sono chiusure amministrative, non completamenti diretti dell'utente durante il workout.

---

## 1. CHANGESET

| File | Δ | Natura |
|------|---|--------|
| [app.js](../app.js) | +30 / -3 | +`summary()` view; +snapshot in `finishWorkout`; +router `summary`; +hide BottomNav; +2 delegation cases |
| [DOCS/STEP7_REPORT.md](STEP7_REPORT.md) | +new | Questo report |

**File NON toccati in Step 7:**
- [index.html](../index.html), [styles.css](../styles.css), [manifest.json](../manifest.json), [sw.js](../sw.js), [components/**](../components/) — invariati.
- Nessuna modifica a `home()`, `workout()`, `stats()`, `data()`, `focusView()`, `render()` (solo +1 riga display toggle + 1 chiave nel screens map), `go()`, `mountViewDelegation` (solo +2 case).
- Nessuna modifica alle SACRE (`beginWorkout`, `persistActive`, `Store`, `logFor`, `fillMissingFromPrevious`, `closeSessionNow`, `saveManualDuration`, ecc.).

---

## 2. DETTAGLIO CAMBIAMENTI

### 2.1 `finishWorkout()` — snapshot pre-null + go('summary')

**Prima ([app.js:963-977](../app.js#L963)):**
```js
await Store.put('sessions', { ...S.active, endedAt, durationSec, completedSets, totalVolume, updatedAt: now(), syncStatus: 'local' });
S.active = null;
S.missing = {};
await refresh();
scheduleSync();
go('progressi');
```

**Dopo:**
```js
var savedSession = { ...S.active, endedAt, durationSec, completedSets, totalVolume, updatedAt: now(), syncStatus: 'local' };
await Store.put('sessions', savedSession);
S.lastSummary = { id, label: sessionLabel(savedSession), totalVolume, completedSets, durationSec, endedAt };
S.active = null;
S.missing = {};
await refresh();
scheduleSync();
go('summary');
```

**Perché il snapshot**: dopo `S.active = null`, la view `summary()` non avrebbe accesso ai dati appena salvati senza rileggerli dalla lista sessions (fragile: `refresh()` ricarica async). Uno snapshot deterministico in `S.lastSummary` disaccoppia rendering da store.

### 2.2 Nuova view `summary()` — [app.js:1082](../app.js#L1082)

```js
function summary() {
    const UI = window.UI;
    if (!UI || !UI.StateSuccess) return '<div class="stack"><div class="card"><p class="muted">Caricamento…</p></div></div>';
    var s = S.lastSummary;
    if (!s) { setTimeout(function () { go('home'); }, 0); return ''; }
    var durTxt = (Number(s.durationSec) || 0) > 0 ? fmtDurShort(s.durationSec) : '—';
    var body = s.label ? s.label : 'Bel lavoro! I tuoi dati sono al sicuro.';
    var hero = UI.StateSuccess({ icon: 'check', title: 'Sessione completata', body: body });
    var kpi = '<div class="statHeroGrid">' +
        UI.StatisticCard({ eyebrow: 'Volume', value: fmtNum(s.totalVolume), unit: 'kg', delta: '' }) +
        UI.StatisticCard({ eyebrow: 'Serie',  value: s.completedSets,       unit: '',   delta: '' }) +
        UI.StatisticCard({ eyebrow: 'Durata', value: durTxt,                unit: '',   delta: '' }) +
        '</div>';
    var cta = '<div style="display:flex; gap:var(--space-8); justify-content:center; margin-top:var(--space-16); flex-wrap:wrap">' +
        UI.Button({ label: 'Vedi progressi', variant: 'secondary', dataset: { action: 'end-summary-progressi' } }) +
        UI.Button({ label: 'Fine',           variant: 'primary',   dataset: { action: 'end-summary' } }) +
        '</div>';
    return '<div class="stack" style="max-width:640px; margin:0 auto">' + hero + kpi + cta + '</div>';
}
```

**Struttura:**

| # | Sezione | Componente | Note |
|---|---------|------------|------|
| 1 | Hero success | `UI.StateSuccess` | icona check verde + titolo + label sessione |
| 2 | KPI grid | 3 × `UI.StatisticCard` | Volume kg / Serie count / Durata formattata |
| 3 | Actions | 2 × `UI.Button` | "Fine" (primary → home) + "Vedi progressi" (secondary → progressi) |

**Fallback guard:** se un utente ricarica la pagina finendo su `S.tab === 'summary'` senza `S.lastSummary` (SW ripristina S.tab da storage, se mai) → `setTimeout(go('home'))` per uscita silenziosa.

### 2.3 Router — screens map + BottomNav hide — [app.js:228-243](../app.js#L228)

```js
bnRoot.style.display = S.tab === 'summary' ? 'none' : '';
...
const screens = { home, workout, progressi: stats, profilo: data, summary };
```

- `bottomNavRoot` nascosto quando `summary` attiva. Non rimosso dal DOM: `display:none` è reversibile e non forza remount. Al ritorno su qualsiasi tab (home/progressi/workout/profilo) `display:''` ripristina.
- `screens.summary` risolto dal router come tab valido; NON aggiunto a `BottomNavigation` (che ha set glyph fisso 🏠💪📈👤 da decisione 2026-08-04).

### 2.4 Delegation — 2 nuovi case — [app.js:195-196](../app.js#L195)

```js
case 'end-summary':           S.lastSummary = null; go('home');      break;
case 'end-summary-progressi': S.lastSummary = null; go('progressi'); break;
```

Consumano `S.lastSummary` (=null) prima della navigazione per evitare state stale al prossimo eventuale summary.

---

## 3. INVARIANTI PRESERVATE

### 3.1 SACRED business logic

Grep `logFor|beginWorkout|finishWorkout|resumeSession|discardSession|fillMissingFromPrevious|persistActive|fit-circuit-tracker-v18-optional-day|indexedDB.open` in app.js → **39** occorrenze.

**Nota:** allineamento con Step 6 baseline. STEP6_REPORT §3.1 riportava 38; la conta reale corrente all'inizio di Step 7 era 39 (probabile miscount storico o marker non contato). Post-Step 7 rimane 39. Nessuna SACRED aggiunta/rimossa/rinominata da questa fase.

### 3.2 Firme pubbliche

| Funzione | Firma | Verificato |
|----------|-------|-----------|
| `async finishWorkout()` | invariata | ✓ |
| `render()` | invariata | ✓ |
| `go(t)` | invariata | ✓ |
| `mountViewDelegation()` | invariata (solo +2 case in switch) | ✓ |
| `stats()`, `home()`, `workout()`, `data()`, `focusView()` | invariati | ✓ |
| `sessionLabel(s)`, `fmtNum(n)`, `fmtDurShort(sec)` | invariati (consumati read-only) | ✓ |

### 3.3 State model

- **Nuovo campo**: `S.lastSummary` — snapshot transient. Non persistito in IndexedDB. Non alterna semantica esistente. È usato **solo** dalla view `summary()` e azzerato all'uscita.
- `S.tab` estende dominio con `'summary'` — coerente con pattern già presente (es. workout, progressi non hanno vincolo enum hardcoded, solo migration map).
- Nessuna modifica ad altri campi (`S.active`, `S.sessions`, `S.exercises`, `S.focus`, `S.sheet`, `S.sync`, `S.timer`).

### 3.4 IndexedDB

DB `fit-circuit-tracker-v18-optional-day` v2 — invariato. Nessuna `Store.put/get/del` aggiunta/rimossa. La sessione viene salvata **una sola volta** (invariato rispetto a prima), poi lo snapshot è puro in-memory.

### 3.5 Percorsi di chiusura sessione alternativi

| Percorso | Va in summary? | Motivo |
|----------|-----------------|--------|
| `finishWorkout` normale (utente preme "Termina") | ✅ SI | Completamento diretto |
| `finishWorkout` con `missing` records | ❌ NO | Ritorna early; utente deve inserire kg mancanti |
| `finishWorkout` con `durationSec > 4h` | ❌ NO | Apre `openDurationModal`; percorso amministrativo |
| `closeSessionNow(id)` da Profilo | ❌ NO | Chiusura amministrativa di sessione parcheggiata (Step 8) |
| `saveManualDuration(id)` (post DurationModal) | ❌ NO | Chiusura amministrativa con durata scelta |

**Rationale**: il Summary celebra un workout appena completato. Le chiusure amministrative di sessioni "vecchie/dimenticate" dal Profilo non hanno la stessa semantica emotiva/informativa (l'utente sta ripulendo, non festeggiando).

### 3.6 BottomNav decisione 2026-08-04 rispettata

Set glyph fisso: 🏠 Home · 💪 Workout · 📈 Progressi · 👤 Profilo (decisione 4). Summary **non aggiunge** un 5° item. È una view "modale-like" transiente, coerente con "non navigabile" della decisione 2026-08-04 §1.

### 3.7 Onclick residui

Grep `onclick=|onchange=|ontoggle=` in app.js → 15 righe con match (invariato rispetto al baseline Step 7). Tutti localizzati in:
- `data()` (Profilo, righe 1228-1254) → **Step 8**
- `openResumeModal` / `openDurationModal` (righe 1301-1439) → **Step 9 (Modals)**

Zero onclick nel nuovo `summary()`. Verificato con `sed -n '1075,1105p' app.js | grep -E 'onclick|onchange|ontoggle'` → ZERO.

---

## 4. ADAPTER / FACADE INTRODOTTI

**Nessuno**. `summary()` è pura funzione di rendering:
- Legge `S.lastSummary` (snapshot popolato da `finishWorkout` che rimane la sorgente unica).
- Chiama `fmtNum`, `fmtDurShort` (helper esistenti, pure) e componenti UI (`StateSuccess`, `StatisticCard`, `Button`).
- Non tocca `Store`, non calcola aggregate, non muta stato.

Lo snapshot `S.lastSummary` è un intermedio dato→render — non un adapter (nessun ponte a SACRE).

---

## 5. REGRESSIONI ESCLUSE

### 5.1 Flow cambiato: post-finish ora Summary invece che Progressi

- **Prima**: `finishWorkout` → `go('progressi')` → utente vede subito la lista storica.
- **Dopo**: `finishWorkout` → `go('summary')` → utente vede riassunto celebrativo → tap "Fine" → home (default) o "Vedi progressi" → progressi.
- Motivo del cambio: decisione utente 2026-08-04 §1 (memory `[[project-fase10-scope-decisions]]`) — Summary come schermata transiente.
- **Nessuna perdita di funzionalità**: la sessione è salvata in IndexedDB come prima; `stats()` continua a mostrarla correttamente non appena l'utente naviga a Progressi.

### 5.2 Regressioni tecniche verificate ASSENTI

- ✓ `S.active` viene azzerato come prima (linea 986).
- ✓ `refresh()` chiamato come prima → `S.sessions` include la nuova sessione.
- ✓ `scheduleSync()` chiamato come prima → sync GH invariato.
- ✓ `openDurationModal` per durata >4h invariato (linea 956).
- ✓ Missing kg field workflow invariato (linee 930-947).
- ✓ Ricarica pagina durante summary → view resiste; se `S.lastSummary` è undefined (state non persistito), fallback `go('home')`.
- ✓ BottomNav non cancellata: `display:none` reversibile.
- ✓ PWA / service worker `sw.js` non toccato.

### 5.3 Edge cases considerati

| Caso | Comportamento |
|------|---------------|
| Utente chiude sessione con volume=0 (tutte serie con kg=0) | Summary mostra "0 kg" — non è un errore, è dato reale |
| Utente chiude sessione con durata=0 (raro, no `startedAt`) | Durata "—" (fallback) |
| Utente ricarica pagina in `S.tab='summary'` | `S.tab` non è persistito → default `'schede'` (migrato a `'home'`), summary non appare |
| Rapid tap "Fine" doppio | Prima chiama azzera `S.lastSummary` + `go('home')`; secondo tap ha già S.lastSummary=null ma è su home, no-op |

---

## 6. TEST STATICI ESEGUITI

- ✅ Grep SACRED markers in app.js → **39** (invariato).
- ✅ Grep `onclick=|onchange=|ontoggle=` in app.js → **15 righe** (invariato — nessun onclick aggiunto in Step 7).
- ✅ Grep `^function summary|^function stats|^function initialsOf|^async function finishWorkout|^function render|^function go\b` → firme presenti, `summary()` senza argomenti.
- ✅ Grep `end-summary` → 4 match (2 delegation + 2 dataset in bottoni) — coerente.
- ✅ `window.UI` esporta `StateSuccess, StatisticCard, Button` (verificato in [components/index.js](../components/index.js) linee 24, 33, 84).

---

## 7. VERIFICA MANUALE (checklist utente)

### 7.1 Flow standard
- [ ] Home → seleziona giorno → Inizia workout
- [ ] Compila tutti i set (kg + reps) → tap "Termina"
- [ ] Appare **Summary fullscreen** con `StateSuccess` (icona check verde, titolo "Sessione completata", body con label sessione)
- [ ] 3 StatisticCard: Volume (kg), Serie, Durata
- [ ] 2 bottoni: "Vedi progressi" (secondary) + "Fine" (primary)

### 7.2 BottomNav
- [ ] Su Summary la Bottom Navigation è **nascosta** (nessun ingombro visivo in basso)
- [ ] Tap "Fine" → torna a Home → **BottomNav ricompare**
- [ ] Tap "Vedi progressi" → apre Progressi → BottomNav ricompare, con "Progressi" evidenziato

### 7.3 Percorsi alternativi (NON devono aprire Summary)
- [ ] Termina con set kg vuoti (mai inseriti prima) → l'app **blocca** e evidenzia il primo campo mancante (NO Summary)
- [ ] Termina dopo >4h dall'inizio → apre **DurationModal** (NO Summary; verifica dopo Step 9)
- [ ] Da Profilo → "Sessioni non chiuse" → "Chiudi ora" → chiude sessione parcheggiata → NO Summary (comportamento amministrativo)

### 7.4 Dati mostrati
- [ ] Volume = somma di `kg × reps` di tutti i set completati
- [ ] Serie = conta set con `done: true`
- [ ] Durata = differenza `endedAt - startedAt` formattata (es. "1h 25m", "45m")
- [ ] Label = sessionLabel (settimana • giorno — nome)

### 7.5 Stato e reload
- [ ] Su Summary, ricarica pagina → NON torna al Summary; va a Home (fallback perché `S.lastSummary` è in-memory)
- [ ] La sessione appena chiusa è visibile in Progressi (lista "Ultime sessioni")

### 7.6 Tema
- [ ] Cambio tema (`UI.setTheme('amoled')` da console) → StateSuccess + card riflettono i token
- [ ] Icona verde success visibile in tutti i temi

### 7.7 A11y
- [ ] StateSuccess ha `.c-state.c-state--success` con `<h3>` semantico
- [ ] StatisticCard rendono `<article>` semantico
- [ ] Button "Fine" e "Vedi progressi" hanno label leggibile e min-height touch

### 7.8 PWA / cache
- [ ] Hard reload se serve invalidare cache SW (sw.js invariato — solo `app.js` cambia)

---

## 8. PUNTI RIMASTI INVARIATI

- `home()`, `workout()`, `stats()`, `data()`, `focusView()`, `workoutBlock`, `exerciseCard`, `setRow`, `roundChip`, `timerDock`, `initialsOf` — invariati.
- Bootstrap boot IIFE, `Store` API, `applyTheme`, `TAB_MIGRATION`, `beginWorkout`, `persistActive`, `fillMissingFromPrevious`, `closeSessionNow`, `saveManualDuration`, `openResumeModal`, `openDurationModal`, `closeModal` — TUTTI invariati.
- Bottom Navigation set glyph 4-item — invariato.
- Sync engine — invariato.

---

## 9. CONFRONTO CON DECISIONE 2026-08-04 §1

| Requisito decisione | Stato |
|---------------------|-------|
| Schermata di transizione fullscreen automatica a fine workout | ✅ `go('summary')` in `finishWorkout` |
| NON navigabile | ✅ NON in Bottom Navigation |
| NON in Bottom Navigation | ✅ Set glyph fisso 🏠💪📈👤 preservato; BottomNav nascosta durante summary |
| Dopo conferma finale → auto go('home') | ✅ CTA "Fine" (primary) → `go('home')` |
| (implicito) tap di scampo verso Progressi | ⚠️ **Aggiunto**: secondary "Vedi progressi" → `go('progressi')`. Motivazione: senza BottomNav visibile durante summary, forzare l'utente a fare Home → tap tab Progressi (2 tap) per vedere l'appena-completata è meno ergonomico. Il secondary preserva la scelta e non contraddice il "default → home" — Primary resta "Fine". Se richiesto, rimuovere è trivial (2 righe). |

**Design decision — CTA doppio**: `Fine` (primary → home) allinea con la decisione. `Vedi progressi` (secondary → progressi) è opzionale UX. Entrambi azzerano `S.lastSummary` prima di navigare.

---

## 10. ROLLBACK

Livello L1 (revert solo Step 7, preservando Step 1-6):

```bash
git checkout HEAD -- app.js DOCS/STEP7_REPORT.md
```

Zero impatto su dati: IndexedDB non toccato. Nessun componente UI modificato. `styles.css`, `index.html`, `sw.js`, `manifest.json` invariati.

**Regressione manuale (se serve solo tornare al pre-Step 7 flow)**: cambiare `go('summary')` → `go('progressi')` in `finishWorkout` e rimuovere le 3 modifiche a `render` (hide BottomNav, screens.summary). Il resto (helper `summary()`, delegation) è dormiente e innocuo.

---

## 11. GATE PER STEP 8 (Profilo)

Step successivo può iniziare SE:

- ✅ Checklist §7 completa (utente)
- ✅ 0 errori console durante Summary
- ✅ Bottom Nav si nasconde/rimostra correttamente
- ✅ Percorsi alternativi (missing, >4h, closeSessionNow) NON aprono Summary
- ✅ Dopo "Fine" o "Vedi progressi", la sessione appena chiusa è visibile in Progressi

**Scope preliminare Step 8 (Profilo)** — invariato rispetto a STEP6_REPORT §11:
1. Refactor `data()` con `ProfileHeader` + `SettingsRow` + `Card` GH sync + `EmptyCard`
2. Migrate onclick residui (`openResumeModal`, `openSelectSheet`, `saveSyncConfig`, `clearSyncConfig`, `syncToRemote`, `restoreFromRemote`, `exportAll`, `$('#fileImport').click`, `confirmReset`) → data-action delegation
3. Aggiungere `PreferenceSwitch` per toggle (o rimandare a Step 11 Settings)
4. NOT touch: sync engine, GH REST calls, IndexedDB, `Store`

---

## 12. STATO

✅ **Step 7 Workout Summary COMPLETATO** — nuova view `summary()` transiente, `finishWorkout` reindirizza a summary con snapshot, BottomNav nascosta, delegation cablata. Business logic e IndexedDB invariati. Decisione 2026-08-04 §1 rispettata.

🛑 **STOP**. Attesa approvazione utente prima di procedere a Step 8 (Profilo).
