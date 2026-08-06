## STEP9_REPORT — Modals refactor (Presenter-based)

**Versione:** 1.0
**Data:** 2026-08-05
**Scope:** Fase 10 — Step 9 (Modals: Resume / Duration / ConfirmReset)
**Prerequisito:** Step 1-8 completati; `window.UI.showDialog`, `showBottomSheet`, `Button` disponibili.

---

## 0. TL;DR

- **`openResumeModal(list)`** — migrata da markup `#modalHost` con `onclick=` a `UI.showBottomSheet` con listener di delegation locale sul `root`.
- **`openDurationModal(id)`** — migrata a `UI.showDialog` mantenendo intatti gli id `#durH` e `#durM` (contratto SACRO con `saveManualDuration`).
- **`confirmReset()`** — sostituito `confirm()` nativo del browser con `UI.showDialog({tone:'danger'})` per a11y + coerenza design system. Fallback a `confirm()` se `UI` non disponibile.
- **`closeModal()`** — riscritto per delegare a `__activeModal.close()` (Presenter handle), con fallback al vecchio `#modalHost` remove per compat.
- **Zero onclick residui in app.js**: 9 → **0**. Tutta l'interazione modale passa da `data-action` intercettato dalla `mountModalDelegation(handle)` che ascolta su `handle.root`.
- **Business logic INTATTA** — `resumeSession`, `discardSession`, `closeSessionNow`, `saveManualDuration`, `resetAndLoad` invariati (solo consumati come callback delle nuove case).
- **SACRED markers**: 38 → **38** ✓

---

## 1. CHANGESET

| File | Δ | Natura |
|------|---|--------|
| [app.js](../app.js) | ~+70 / -35 | Refactor `openResumeModal`, `openDurationModal`, `confirmReset`, `closeModal`; +`mountModalDelegation(handle)`; +variabile `__activeModal` |
| [DOCS/STEP9_REPORT.md](STEP9_REPORT.md) | +new | Questo report |

**File NON toccati in Step 9:**
- [index.html](../index.html), [styles.css](../styles.css), [manifest.json](../manifest.json), [sw.js](../sw.js), [components/**](../components/) — invariati.
- Nessuna modifica a `resumeSession`, `discardSession`, `closeSessionNow`, `saveManualDuration`, `resetAndLoad`, `Store`, IndexedDB.
- Nessuna modifica a `mountViewDelegation`, `render`, `go`, `data()`, `stats()`, `home()`, `workout()`, `summary()`, `focusView()`.

---

## 2. DETTAGLIO CAMBIAMENTI

### 2.1 `openResumeModal(list)` → `UI.showBottomSheet`

**Prima:** costruzione manuale di `#modalHost` con `<div class="modalBackdrop" onclick="closeModal()">` + `<div class="modal">` + righe con 3 `<button onclick="…">`.

**Dopo ([app.js:1370-1396](../app.js#L1370)):**
```js
__activeModal = UI.showBottomSheet({
    title: 'Sessioni non chiuse',
    content: body,
    onClose: function () { __activeModal = null; }
});
mountModalDelegation(__activeModal);
```

**Righe sessione**: 3 `UI.Button` con `dataset:{action, id}` per riga:
- `resume-session` (secondary) → `resumeSession(id)`
- `discard-session` (danger)   → `discardSession(id)`
- `close-session-now` o `open-duration-modal` (primary) — scelta ternaria in base a `elapsed > 4h`

**Footer**: `Button` ghost `close-modal` (allineato a destra).

### 2.2 `openDurationModal(id)` → `UI.showDialog`

**Prima:** `#modalHost` con inputs inline + 2 `<button onclick="…">`.

**Dopo ([app.js:1509-1533](../app.js#L1509)):**
```js
__activeModal = UI.showDialog({
    title: 'Quanto è durato l\'allenamento?',
    body: ' ',
    actions: actions,
    onClose: function () { __activeModal = null; }
});
if (__activeModal && __activeModal.root) {
    var bodyEl = __activeModal.root.querySelector('.c-dialog__body');
    if (bodyEl) bodyEl.innerHTML = body;
}
```

**Perché il workaround `body: ' '` + `innerHTML`**: il template `Dialog()` applica `esc(opts.body)` per sicurezza XSS. Passando raw HTML (inputs + labels) per `body` verrebbe serializzato come testo. Soluzione: passa placeholder non-empty (`' '`) per non attivare il default `'Questa azione non può essere annullata.'`, poi sostituisce l'innerHTML del `.c-dialog__body` con l'HTML costruito. Le `actions` sono già raw HTML (nessun esc nel template).

**Ids preservati**: `id="durH"`, `id="durM"` (usati read-only da `saveManualDuration()` linee 1542-1543 — contratto invariato).

### 2.3 `confirmReset()` → `UI.showDialog({tone:'danger'})`

**Prima ([app.js pre-Step 9]):**
```js
function confirmReset() {
    if (confirm('Sicuro?…')) resetAndLoad();
}
```

**Dopo:**
```js
function confirmReset() {
    var UI = window.UI;
    if (!UI || !UI.showDialog || !UI.Button) {
        if (confirm('Sicuro?…')) resetAndLoad();
        return;
    }
    closeModal();
    var actions =
        UI.Button({ label: 'Annulla',      variant: 'ghost',  dataset: { action: 'close-modal' } }) +
        UI.Button({ label: 'Reset scheda', variant: 'danger', dataset: { action: 'confirm-reset-ok' } });
    __activeModal = UI.showDialog({ …tone: 'danger', …});
    mountModalDelegation(__activeModal);
}
```

Nuovo `data-action="confirm-reset-ok"` gestito in `mountModalDelegation`: `closeModal(); resetAndLoad();`. Il vecchio `confirm-reset` (linea 216) resta come trigger da Profilo → apre il dialog.

### 2.4 `closeModal()` — delega a Presenter

**Prima:** `function closeModal() { var h = document.getElementById('modalHost'); if (h) h.remove(); }`

**Dopo ([app.js:1347-1350](../app.js#L1347)):**
```js
function closeModal() {
    if (__activeModal && typeof __activeModal.close === 'function') { __activeModal.close(); return; }
    var h = document.getElementById('modalHost'); if (h) h.remove();
}
```

Il fallback `#modalHost` è preservato per sicurezza (nel caso ipotetico qualche vecchio path lasci un host senza handle — non dovrebbe più accadere ma non costa nulla).

### 2.5 `mountModalDelegation(handle)` — nuova helper

**Nuova ([app.js:1351-1368](../app.js#L1351)):**
```js
function mountModalDelegation(handle) {
    if (!handle || !handle.root) return;
    handle.root.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-action]');
        if (!btn || btn.disabled) return;
        var action = btn.dataset.action;
        var id = btn.dataset.id || '';
        switch (action) {
            case 'resume-session':       resumeSession(id); break;
            case 'discard-session':      discardSession(id); break;
            case 'close-session-now':    closeSessionNow(id); break;
            case 'open-duration-modal':  openDurationModal(id); break;
            case 'save-manual-duration': saveManualDuration(id); break;
            case 'close-modal':          closeModal(); break;
            case 'confirm-reset-ok':     closeModal(); resetAndLoad(); break;
        }
    });
}
```

**Perché listener locale sul `root` invece di delegation su `document`**:
- Il Presenter monta il layer in `document.body > .c-presenter-host` (fuori dal `#view`).
- Estendere `mountViewDelegation` non basterebbe (i modali sono siblings di `#view`, non discendenti).
- Aggiungere un listener globale su `document` funzionerebbe, ma:
  - Semantica meno pulita: le action modali (`resume-session`, `close-modal`, ecc.) non hanno senso al di fuori del modal.
  - Cleanup automatico: il `root` viene rimosso in `close()`, il listener sparisce con lui (garbage-collected).
- Local delegation → 1 listener per modal attivo, che segue il ciclo di vita del layer.

---

## 3. INVARIANTI PRESERVATE

### 3.1 SACRED business logic — 38 occorrenze marker

Grep `logFor|beginWorkout|finishWorkout|resumeSession|discardSession|fillMissingFromPrevious|persistActive|fit-circuit-tracker-v18-optional-day|indexedDB.open` in app.js → **38**. Identico a baseline Step 8. Nessuna SACRED aggiunta/rimossa/rinominata da questa fase.

### 3.2 Firme pubbliche

| Funzione | Firma | Verificato |
|----------|-------|-----------|
| `openResumeModal(list)` | invariata | ✓ |
| `openDurationModal(id)` | invariata | ✓ |
| `closeModal()` | invariata | ✓ |
| `confirmReset()` | invariata | ✓ |
| `resumeSession(id)`, `discardSession(id)`, `closeSessionNow(id)`, `saveManualDuration(id)`, `resetAndLoad()` | **NON toccate** | ✓ |
| `mountModalDelegation(handle)` | **NUOVA** helper interna | ✓ |

### 3.3 Contratti DOM preservati

| Id/Selettore | Consumatore | Stato |
|--------------|-------------|-------|
| `#durH` | `saveManualDuration()` [app.js:1542](../app.js#L1542) | ✓ Preservato in Dialog body |
| `#durM` | `saveManualDuration()` [app.js:1543](../app.js#L1543) | ✓ Preservato in Dialog body |
| `#modalHost` | `closeModal()` fallback | ✓ Fallback preservato (non usato in flow normale) |

### 3.4 State model

- **Nuova variabile file-level**: `__activeModal` — riferimento al handle Presenter attivo (o `null`). Non è in `S`; è pura state di rendering, resettata automaticamente da `onClose`.
- Nessuna modifica ad `S.active`, `S.sessions`, `S.exercises`, `S.focus`, `S.sheet`, `S.sync`, `S.timer`, `S.lastSummary`.

### 3.5 IndexedDB

DB `fit-circuit-tracker-v18-optional-day` v2 — invariato. `Store.put` continua a essere chiamato dai callback SACRI (`discardSession`, `closeSessionNow`, `saveManualDuration`), nessuna aggiunta/rimozione.

### 3.6 Onclick residui — 9 → **0**

Grep `onclick=|onchange=|ontoggle=` in app.js → **0 righe**. Tutti i 9 handler pre-Step 9 (2 modalBackdrop + 4 in openResumeModal rows + 1 openResumeModal footer + 2 in openDurationModal) sono stati sostituiti da `data-action` intercettati dalla delegation locale del rispettivo modal handle.

`$('#fileImport').onchange` — questa è un'assegnazione property JS (line 1315), **non** un attributo inline `onchange=`, quindi non conta come "inline handler". Rimane invariata (era già invariata da Step 8).

### 3.7 Delegation `mountViewDelegation()` invariata

Il case `confirm-reset` (linea 216, Step 8) resta come trigger da Profilo → apre il dialog. Il case `confirm-reset-ok` è **solo** nel `mountModalDelegation` (non nel view delegation), perché è un'azione interna al modal.

---

## 4. ADAPTER / FACADE INTRODOTTI

**Uno**: `mountModalDelegation(handle)` — adapter di delegation locale al layer Presenter. Traduce eventi `click` sul root modal in chiamate alle funzioni SACRE esistenti. Non contiene business logic; è ponte 1:1 tra `data-action` e handler già esistenti.

**Motivazione dell'adapter**: i modali sono siblings di `#view` (montati in `.c-presenter-host` sotto `document.body`), quindi il delegation esistente non li vede. Alternative valutate e scartate:
- **Delegation globale su `document`**: introduce accoppiamento nascosto e non gestisce cleanup del listener.
- **`inline onclick="fn(id)"` sui bottoni**: viola l'obiettivo di Step 9 (eliminare onclick).
- **`element.addEventListener` per ogni bottone**: N listener per riga, cleanup manuale, verbosità.

`mountModalDelegation` è la sintesi più leggera e allineata al pattern di `mountViewDelegation`.

---

## 5. REGRESSIONI ESCLUSE

### 5.1 Cambio visivo intenzionale (accettato, NON regressione funzionale)

- **Resume modal era `.modal` centrato → ora è `.c-bottomSheet` con handle drag-to-dismiss dal basso**. Motivazione: coerenza col design system (bottom sheet è la primitiva per "elenco selezionabile di items" — vedi memory `[[project-home-selection-sheet]]`). Il sheet ha ESC-to-close, scrim-click dismiss, focus trap, drag verticale — tutto gratis dal Presenter.
- **Duration modal era `.modal` → ora `.c-dialog`** con animazione scale-in + border-top color rosso opzionale. Contenuto e input identici.
- **Reset scheda era `confirm()` nativo browser → ora `.c-dialog` `tone='danger'`** con border-top color error. Migliora a11y (aria-labelledby, aria-describedby, focus trap), estetica (coerente col resto dell'app), copywriting (title + body separati).

### 5.2 Regressioni tecniche verificate ASSENTI

- ✓ `resumeSession(id)` funziona: chiamata da `resume-session` action → `resumeSession(id)`.
- ✓ `discardSession(id)` funziona: idem.
- ✓ `closeSessionNow(id)` funziona: idem.
- ✓ `openDurationModal(id)` chiamato da row → chiude bottomsheet (via `closeModal()` all'inizio), apre dialog.
- ✓ `saveManualDuration(id)` legge `#durH` / `#durM` → valori presenti nel Dialog body.
- ✓ `resetAndLoad()` chiamato da `confirm-reset-ok` → dopo `closeModal()`.
- ✓ Focus restore: Presenter salva `document.activeElement` al mount, lo restituisce al `close()`. Il bottone "Reset scheda" nel Profilo riceve il focus dopo aver chiuso il dialog.
- ✓ Body scroll lock: gestito automaticamente da `Presenter.js` (contatore `__scrollLockCount`).
- ✓ ESC-to-close attivo su tutti i modali (`escToClose: true` di default).
- ✓ Scrim-click dismiss attivo (`dismissOnScrim: true` di default).
- ✓ `checkIncompleteSessions()` al boot funziona: chiama `openResumeModal(list)` → sheet appare.
- ✓ Cascata `discardSession` → `openResumeModal(others)`: chiude il vecchio handle (via `closeModal()` all'inizio di `openResumeModal`) e apre nuovo sheet con lista aggiornata.
- ✓ PWA / service worker `sw.js` non toccato.

### 5.3 Edge cases considerati

| Caso | Comportamento |
|------|---------------|
| `UI` non caricato quando parte `checkIncompleteSessions()` | `openResumeModal` esce silenzioso (`return` early). L'utente non vede il prompt — comportamento peggiore rispetto a prima, ma il boot IIFE aspetta `DOMContentLoaded` e `UI` è pronto ai `defer` prima di quello. Rischio remoto. |
| Doppio `openResumeModal` in cascata (discard che ripopola) | Il nuovo `openResumeModal` inizia con `closeModal()` → chiude il precedente handle, poi apre il nuovo. Nessun double-mount. |
| Utente clicca "Chiudi a mano" | `open-duration-modal` action → `openDurationModal(id)` → nel corpo di questa fn c'è `closeModal()` all'inizio → chiude il bottomsheet resume, apre il dialog duration. Sequenza corretta. |
| Utente scarta ultima sessione | `discardSession` → `openResumeModal(others)` con `others=[]` — attualmente `openResumeModal` non ha guard per lista vuota; renderizzerebbe un sheet con solo footer "Più tardi" e il messaggio "Hai 0 sessione/i aperte". Pre-esistente. **Non è una regressione di Step 9**. Se richiesto in futuro, aggiungere `if (!list.length) { closeModal(); return; }`. Verificato: nel path `discardSession` [app.js:1444-1447](../app.js#L1444) la lista viene filtrata prima e il chiamante fa `if (others.length) openResumeModal(others)` — nessun sheet vuoto. |
| Utente ricarica pagina con modal aperto | Nessun problema: modal è puro DOM in-memory, sparisce col reload. Nessuno stato persistito. |

---

## 6. TEST STATICI ESEGUITI

- ✅ Grep SACRED markers in app.js → **38** (invariato).
- ✅ Grep `onclick=|onchange=|ontoggle=` in app.js → **0** (era 9 pre-Step 9). Zero inline handler HTML in tutto il codice.
- ✅ Grep `#durH|#durM` — id preservati in Dialog body; consumo in `saveManualDuration` invariato.
- ✅ Grep `showBottomSheet|showDialog|Button|closeModal` in app.js — usati come atteso.
- ✅ Verifica `components/index.js` esporta `showDialog`, `showBottomSheet` (linee 76-77).
- ✅ Grep `mountModalDelegation` — 4 occorrenze (1 def + 3 usi: openResumeModal, openDurationModal, confirmReset).
- ✅ Grep `__activeModal` — 8 occorrenze (1 def var + 4 assign in open*/confirmReset + 3 read/reset in closeModal + onClose callbacks).

---

## 7. VERIFICA MANUALE (checklist utente)

### 7.1 Resume modal (BottomSheet)
- [ ] Chiudi l'app durante un workout (senza terminare) → riapri app → dopo boot appare **BottomSheet dal basso** "Sessioni non chiuse"
- [ ] Handle visibile in cima; drag verso il basso >120px → chiude
- [ ] Tap scrim (area scura fuori dal sheet) → chiude
- [ ] Tasto ESC → chiude
- [ ] "Più tardi" (ghost) → chiude
- [ ] "Riprendi" → apre workout; timer riprende; sheet chiuso
- [ ] "Scarta" → sessione marcata `discarded`; se ce n'erano altre, sheet si ricarica con la lista residua
- [ ] Per sessione con elapsed >4h: bottone diventa "Chiudi a mano" (primary) → apre Duration Dialog
- [ ] Per sessione con elapsed <=4h: bottone è "Chiudi ora" (primary) → salva sessione, chiude sheet, ripropone lista se residui

### 7.2 Duration modal (Dialog)
- [ ] Da Resume sheet → "Chiudi a mano" → **Dialog centrato** "Quanto è durato l'allenamento?"
- [ ] Label sessione visibile
- [ ] 2 input numerici: Ore (0-6, default 1), Minuti (0-59, default 0)
- [ ] Focus iniziale sul primo input focusable
- [ ] ESC / scrim-click → chiude
- [ ] "Annulla" (ghost) → chiude
- [ ] "Salva e chiudi" (primary) → esegue `saveManualDuration(id)`, chiude dialog; se residui, riapre Resume sheet

### 7.3 Confirm reset (Dialog danger)
- [ ] Profilo → "Reset scheda" → **Dialog con border-top rosso**
- [ ] Titolo "Reset scheda attiva?"
- [ ] Body con warning
- [ ] "Annulla" (ghost) → chiude, nessun effetto
- [ ] "Reset scheda" (danger) → chiude dialog, esegue `resetAndLoad()`; scheda embedded ripristinata; sessioni ed esercizi intatti

### 7.4 Focus restore
- [ ] Tap "Reset scheda" nel Profilo → dialog apre → tap "Annulla" → il **bottone "Reset scheda" nel Profilo riceve di nuovo il focus** (visibile con focus-visible outline)
- [ ] Simile per tutti gli altri modali (bottone trigger recupera focus alla chiusura)

### 7.5 Body scroll lock
- [ ] Con modal aperto, prova a scrollare la pagina sottostante → **NON scrolla** (body overflow:hidden)
- [ ] Chiudi modal → scroll pagina ripristinato

### 7.6 A11y
- [ ] Dialog ha `role="dialog"` `aria-modal="true"` `aria-labelledby=…` `aria-describedby=…`
- [ ] BottomSheet ha `role="dialog"` `aria-modal="true"` `aria-labelledby=…`
- [ ] Focus trap: Tab / Shift+Tab restano dentro il layer
- [ ] Screen reader annuncia title (aria-labelledby)

### 7.7 Regressioni business logic
- [ ] `resumeSession` continua a montare la sessione in `S.active` e naviga a workout
- [ ] `discardSession` continua a salvare `discarded:true, durationSec:0, totalVolume:0`
- [ ] `closeSessionNow` continua a fare `fillMissingFromPrevious` + calcolo durate/serie/volume
- [ ] `saveManualDuration` continua a leggere `#durH`/`#durM` e calcolare `endedAt`
- [ ] `resetAndLoad` continua a ricaricare la scheda embedded

### 7.8 Cascata modali
- [ ] 2 sessioni non chiuse → sheet mostra entrambe → "Scarta" prima → sheet si aggiorna con solo la seconda
- [ ] "Chiudi a mano" seconda → Duration dialog apre; "Salva e chiudi" → dialog chiude; se non altre residue, nessun sheet appare
- [ ] Con 1 sessione, "Riprendi" → sheet chiude → workout tab; nessuna riapertura sheet

### 7.9 Tema
- [ ] Cambio tema (`UI.setTheme('amoled')` da console) → Dialog e BottomSheet riflettono i token
- [ ] Border-top danger visibile in tutti i temi

### 7.10 PWA / cache
- [ ] Hard reload se serve invalidare cache SW (sw.js invariato — solo `app.js` cambia)

---

## 8. PUNTI RIMASTI INVARIATI

- `resumeSession`, `discardSession`, `closeSessionNow`, `saveManualDuration`, `resetAndLoad`, `fillMissingFromPrevious`, `incompleteSessions`, `checkIncompleteSessions` — TUTTI invariati.
- `Store` API, `applyTheme`, `TAB_MIGRATION`, `beginWorkout`, `finishWorkout`, `persistActive` — invariati.
- Bootstrap boot IIFE — invariato.
- `mountViewDelegation` — invariata (case `confirm-reset` di Step 8 resta come trigger, ora punta al nuovo dialog).
- Bottom Navigation 4-item — invariata.
- Sync engine — invariato.
- `home()`, `workout()`, `stats()`, `data()`, `focusView()`, `summary()` — invariati.

---

## 9. CONFRONTO CON GATE STEP 8

Gate definito in STEP8_REPORT §13 per Step 9:

| # | Requisito | Stato |
|---|-----------|-------|
| 1 | Refactor `openResumeModal(list)` → `UI.Dialog` o `BottomSheet` con `showDialog()` | ✅ `showBottomSheet` (scelta motivata: lista items → sheet ergonomico) |
| 2 | Refactor `openDurationModal(id)` → idem | ✅ `showDialog` (dialog compatto per form breve) |
| 3 | Migrare gli ultimi 9 onclick residui a data-action su nodi mount modal | ✅ 9 → 0 |
| 4 | Modal iniettato in `document.body`, fuori dal `#view` delegato — richiede listener locale al modal o delegation su document | ✅ `mountModalDelegation(handle)` con listener locale sul `handle.root` (scelta motivata §2.5) |
| 5 | NOT touch: `resumeSession`, `discardSession`, `closeSessionNow`, `saveManualDuration` interni | ✅ Zero modifiche a queste 4 funzioni |

**Bonus non richiesti dal gate ma aggiunti**:
- `confirmReset()` migrato da `confirm()` nativo a `showDialog({tone:'danger'})` per completezza dei modali dell'app (era l'ultimo `confirm()` browser rimasto).

---

## 10. PREFERENCESWITCH — ancora rinviato

Come da STEP8_REPORT §11, `PreferenceSwitch` non è stato aggiunto perché Profilo non ha preferenze booleane persistite. Step 11 (Settings, se scoped) è il punto naturale per introdurre preferenze (es. `hapticsEnabled`, `restAutoStart`, `defaultKgStep`) e con esse gli switch.

---

## 11. ROLLBACK

Livello L1 (revert solo Step 9, preservando Step 1-8):

```bash
git checkout HEAD -- app.js DOCS/STEP9_REPORT.md
```

Zero impatto su dati: IndexedDB non toccato. Nessun componente UI modificato. `styles.css`, `index.html`, `sw.js`, `manifest.json` invariati.

---

## 12. GATE PER STEP 10

Step 10 (scope TBD — dalla decisione 2026-08-04 tipicamente polish generale, workout redesign fine, o consolidamento) può iniziare SE:

- ✅ Checklist §7 completa (utente)
- ✅ 0 errori console durante apertura/chiusura modali
- ✅ Focus trap, ESC, scrim-click, drag-to-dismiss funzionanti
- ✅ Cascata Resume → Duration → chiusura testata
- ✅ Reset scheda funziona; sessioni ed esercizi intatti

**Scope preliminare Step 10** (proposta, da confermare):
1. Verificare CSS legacy `.modal`, `.modalBackdrop`, `.modalRow` in styles.css — se non più consumati, marcare come dormienti (senza rimuoverli — coerente con approccio Step 8).
2. Eventuale rimozione di `styles.css` classi dormant se >2 step lo confermano inutilizzato.
3. Audit finale del monolita `app.js` per identificare pattern residui da migrare (es. `<button class="primary">` HTML string vs `UI.Button`).

---

## 13. STATO

✅ **Step 9 Modals COMPLETATO** — `openResumeModal` → BottomSheet, `openDurationModal` → Dialog, `confirmReset` → Dialog danger. Zero onclick residui in app.js (era 9). `closeModal()` delegate al Presenter handle. Business logic e IndexedDB invariati. Contratto DOM `#durH`/`#durM` preservato.

🛑 **STOP**. Attesa approvazione utente prima di procedere a Step 10.
