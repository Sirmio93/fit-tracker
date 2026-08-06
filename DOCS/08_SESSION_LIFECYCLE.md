# 08_SESSION_LIFECYCLE.md

Versione 1.0 (Sprint 4.5 · 2026-08-06)

---

# Filosofia

Una sessione deve essere facile da iniziare, cambiare, eliminare, recuperare — mai intrappolante.

L'utente non deve mai sentirsi bloccato dentro una sessione. Ogni azione distruttiva è proporzionata allo stato reale della sessione.

Draft (silenzioso) → Active (protetto) → Completed (celebrato) → Discarded (leggero)

---

# Decisioni Sprint 4.5 (2026-08-06)

Approvate dall'utente e vincolanti per ogni futura modifica al ciclo di vita.

1. **Draft vs Active — unica fonte di verità: `exerciseLogs`**
   - Draft finché `exerciseLogs.length === 0`
   - Active al primo `saveSetLog()` (`exerciseLogs.length > 0`)
   - Una sessione Active non può tornare Draft
   - Nessuna nuova variabile di stato, nessun timestamp aggiuntivo
   - Auto-cleanup silenzioso di bozze `>24h`

2. **Home Session Card — sotto Hero, sopra GoalCard**
   - Compare solo se esiste `S.active` (Draft o Active)
   - In assenza di sessione la Home rimane invariata (GoalCard nella sua posizione naturale)
   - Priorità visiva sulla GoalCard ma non la sostituisce
   - Contenuti contestuali: badge stato, label sessione, meta (`fmtDurShort + N serie`), CTA "Continua" + menu `⋮`

3. **Toast Foundation — nuovo componente riutilizzabile**
   - API `pushToast(message, opts)` (queue-aware, non blocca focus/scroll)
   - Variants: `success | info | warning | error | default`
   - Un solo toast visibile alla volta, coda FIFO
   - Deduplicazione consecutiva (stesso message+variant → rialza timer)
   - Swipe verticale per dismiss immediato
   - Bottom-center, safe-area aware, sopra BottomNav
   - `aria-live="polite"`, focus mai rubato
   - Supporto ad azione opzionale (Undo/Apri/Riprova)

4. **Restore Session — banner Home + Workout empty state**
   - App non riapre mai automaticamente un workout
   - Boot: `checkIncompleteSessions()` NON aperto (era il modale). Restore Banner in Home guida.
   - Restore Banner: primo elemento in `home-scroll`, azioni Continua/Elimina (contestuali per Draft/Active)
   - Tab Workout: se `!S.active` e ci sono bozze/attive in DB → empty state dedicato con "Hai una sessione in sospeso" + Riprendi + Nuovo allenamento
   - Preserva la scelta all'utente in ogni momento

---

# Vincoli

NON modificare:

- Business Logic (`beginWorkout`, `finishWorkout`, `toggleExerciseSet`, `toggleRound`, `logFor`, `persistActive`, `saveSetLog`)
- IndexedDB `fit-circuit-tracker-v18-optional-day` v2
- Modello dati (S shape, exerciseLogs, sessions, cards, exercises)
- Algoritmi (progressione, calcolo volume, streak, PR)
- Storage (Store.put, refresh)
- Timer
- BottomNavigation
- Home v3 / Workout v4 / Progress v5 / Rest overlay / Storico Sprint 6 / Profilo redesign

Aggiungere esclusivamente:

- `S.session` (transient UX state, mai persistito)
- Helper puri (`sessionIsDraft`, `sessionIsActive`, `sessionElapsedSec`, `sessionSetsCompleted`, `pendingSessionsInDb`, `pendingDraftsBesidesActive`, `autoCleanupOldDrafts`)
- Renderer (`homeSessionCardHtml`, `homeRestoreBannerHtml`, `workoutPendingEmptyHtml`, `workoutMenuButtonHtml`, `sessionStatusBadgeHtml`)
- Action functions (`openSessionSheet`, `openConfirmDialog`, `sessionActionContinue/Change/Discard/Restart`, `sessionRestoreContinue/Discard`, `discardActiveNow`, `restartActiveNow`, `restoreDraftSession`, `discardDraftById`, `sessionSwitchTo`, `dismissRestoreBanner`)
- Toast wrapper (`appToast`)
- Nuovo root DOM `#toastRoot` in `index.html`
- Extension al componente `Toast` con API `pushToast`
- Nuova sezione CSS `SESSION LIFECYCLE v1 (Sprint 4.5)` in `styles.css`

---

# Struttura DOM

```
#view (tab home)
└── .home
    ├── .home-fold     (header + hero)
    └── .home-scroll
        ├── .home-section--restore  (restoreBanner) — solo se !S.active && draft in DB
        ├── .home-section--session  (sessionCard)   — solo se S.active
        ├── .home-section--stats    (StatisticCard × 2)
        ├── .home-section--ring     (ProgressRing) — solo se S.active
        ├── .home-section--history  (HistoryCard × 5)
        └── .home-section--goal     (GoalCard)

#view (tab workout con !S.active + drafts)
└── .workoutPending
    └── .workoutPending__inner   (icon + titolo + meta + Riprendi/Nuovo)

#view (tab workout con S.active)
└── .workoutV4
    ├── .c-workoutHeader          (con badge + view + start + menu ⋮)
    └── ...body

#fabRoot
└── FAB extended  (data-action: session-open se S.active, open-select se no)

#toastRoot
└── .c-toastQueueItem × 1        (bottom-center, safe-area aware)

Presenter host (dialogs / bottom sheets)
├── SessionSheet   (Continua/Cambia/Riavvia/Scarta/Chiudi)
├── ConfirmDialog  (per azioni distruttive su Active)
└── SelectSheet    (con link "← Torna alla Home" all'inizio)
```

---

# State (`S.session`)

Estensione di `S`, in-memory, mai persistito.

```js
S.session = {
    sheet: null,                     // 'lifecycle' | null — flag sheet aperto
    confirm: null,                   // { handle, onConfirm, onCancel } | null
    restoreBannerDismissed: {},      // { [sessionId]: true } — dismissi UX
    pendingSwitch: null,             // reserved per future flows
    restored: false                  // marker "questa sessione è stata ripristinata"
};
```

`S.session` è ricostruito ad ogni boot. Nessuna migrazione, nessuna versione persistente.

---

# Helper puri (`app.js`)

Zero side-effect, zero IndexedDB, deterministici.

- `sessionHasLogs(s)` → `boolean`
- `sessionIsDraft(s)` → `!endedAt && !hasLogs`
- `sessionIsActive(s)` → `!endedAt && hasLogs`
- `sessionElapsedSec(s)` → secondi trascorsi da `startedAt` (0 se non startato)
- `sessionSetsCompleted(s)` → count dei log con `done === true`
- `pendingSessionsInDb()` → sessioni con `!endedAt`, ordinate desc per `updatedAt/startedAt`
- `pendingDraftsBesidesActive()` → pending in DB escluse quella già caricata in `S.active`
- `sessionStatusLabel(s)` → `'Bozza' | 'In corso' | 'Sessione'`
- `sessionSummaryLine(s)` → stringa `"12 min · 5 serie"` (o `"Nessun set completato"`)

---

# Renderer (`app.js`)

- `homeSessionCardHtml()` → card sotto Hero (solo se S.active)
- `homeRestoreBannerHtml()` → banner sopra stats (solo se !S.active && draft in DB)
- `workoutPendingEmptyHtml(pending)` → empty state tab Workout senza sessione ma con pending in DB
- `workoutMenuButtonHtml()` → button `⋮` per aprire session sheet dal header
- `sessionStatusBadgeHtml(s, opts)` → badge pill con dot pulsante ("Bozza" giallo, "In corso" verde)

---

# Actions (`app.js`)

Aperture:
- `openSessionSheet()` — Bottom Sheet ciclo-vita con 4 azioni contestuali
- `openConfirmDialog(cfg)` — Dialog di conferma (title/body/tone/confirmLabel/onConfirm/onCancel)

Azioni sessione corrente:
- `sessionActionContinue(handle)` — chiude sheet + `go('workout')`
- `sessionActionChange(handle)` — chiude sheet + apre SelectSheet (poi `sheetPickDay` intercetta lo switch)
- `sessionActionRestart(handle)` — Draft: `restartActiveNow`; Active: confirm dialog + restart
- `sessionActionDiscard(handle)` — Draft: `discardActiveNow`; Active: confirm dialog + discard

Azioni Draft persistiti:
- `sessionRestoreContinue(id)` — `restoreDraftSession(id)` (blocca se S.active già presente)
- `sessionRestoreDiscard(id)` — Draft: immediate; Active: confirm dialog

Mutazioni async:
- `discardActiveNow(toastMsg?)` — chiude S.active, marchia session come discarded, salva, toast
- `restartActiveNow()` — azzera exerciseLogs/startedAt/rounds, mantiene cardId/weekKey/dayKey
- `restoreDraftSession(id)` — carica sessione da DB in S.active, va a Workout tab
- `discardDraftById(id)` — marchia sessione come discarded (per una draft in DB)
- `sessionSwitchTo(cardId, weekKey, dayKey)` — scarta la corrente (marca discarded se Active, del se Draft) + startDay

UX helpers:
- `dismissRestoreBanner(id)` — flag `S.session.restoreBannerDismissed[id]`
- `autoCleanupOldDrafts()` — rimuove Draft `>24h` dal DB al boot
- `appToast(message, variant, opts)` — wrapper per `UI.pushToast`

---

# Flusso FAB

```
Home → FAB extended
├── S.active === null → click → openSelectSheet()
└── S.active esiste   → click → openSessionSheet()
                                 ├── Continua       → go('workout')
                                 ├── Cambia         → openSelectSheet() → sheetPickDay intercepta
                                 ├── Riavvia        → confirm (se Active) → restartActiveNow
                                 └── Scarta         → confirm (se Active) → discardActiveNow
```

FAB non entra mai direttamente nel workout quando esiste una sessione. Sempre attraverso il sheet.

---

# Flusso Switch Workout (Draft/Active)

`sheetPickDay(cardId, weekKey, dayKey)` (chiamata da SelectSheet tap giorno):

```
sheetPickDay
├── !S.active → startDay(...) (comportamento originale)
└── S.active esiste
    ├── sessionIsActive → openConfirmDialog("Sostituire?") → sessionSwitchTo
    └── sessionIsDraft  → sessionSwitchTo (silenzioso, no dialog)
```

`sessionSwitchTo`: se sessione corrente è Active → mark discarded + Store.put; se Draft → Store.del (bozza orfana rimossa). Poi startDay + toast.

---

# Flusso Boot

```
1. Store.open
2. loadSyncConfig
3. mountViewDelegation
4. refresh (S.sessions caricate)
5. importPlan(EMBEDDED_SCHEDA) se S.cards vuoto
6. migrateDedupExercises
7. autoCleanupOldDrafts() → rimuove Draft >24h da IndexedDB
8. NON aprire più checkIncompleteSessions modal
9. GitHub restore prompt se configurato
```

L'utente vede la Home. Se c'è draft pendente → Restore Banner. Se apre Workout senza aver ripreso → Workout Pending empty state. Sempre in controllo.

---

# Toast Queue

Sistema di feedback non bloccante. Nuovo componente riutilizzabile in tutta l'app.

Comportamento:
- Host dedicato `#toastRoot` (non condiviso col Presenter — no focus trap, no body scroll lock)
- Un solo toast visibile alla volta, coda FIFO
- Dedup: `pushToast` con stesso `message+variant` non enqueue, rialza il timer del corrente
- Swipe verticale (>60px) per dismiss immediato
- Auto-dismiss dopo `durationMs` (default 2500ms)
- Action button opzionale (label + onClick)

Uso in app:
```js
appToast('Sessione eliminata', 'success');
appToast('Allenamento cambiato', 'success');
appToast('Sessione ripristinata', 'info');
appToast('Sessione riavviata', 'info');
appToast('Chiudi prima la sessione corrente', 'warning');
appToast('Bozza eliminata', 'success');
```

Riutilizzabile per futuri feedback (Undo, Apri, Riprova, ecc.).

---

# Confermi intelligenti

Draft → nessuna conferma per azioni distruttive (elimina, sostituisci, riavvia).
Active → conferma modale con tone `danger`.

Ratio: la Draft è un artefatto UX temporaneo (nessun set completato = nessun dato utente). L'Active ha dati che l'utente ha investito tempo a produrre.

Implementazione via `openConfirmDialog({title, body, tone, confirmLabel, onConfirm, onCancel})` che usa `UI.showDialog` con delegation locale sul root del dialog.

---

# Accessibilità

- **Session Card**: `role="group"` + `aria-labelledby` sul titolo, badge con `role="status"` + `aria-label` esplicito, menu btn `aria-label="Altre azioni sessione"`
- **Restore Banner**: `role="region"` + `aria-live="polite"`, azioni sono button con label chiara
- **Session Sheet**: eredita `role="dialog"` + `aria-modal="true"` da BottomSheet component, action buttons con min-height ≥ 48px
- **Confirm Dialog**: `role="dialog"` + `aria-modal="true"` + tone `danger` visivo
- **Workout badge**: `role="status"` + `aria-label="Stato sessione: Bozza"` (o "In corso")
- **Workout menu button**: `aria-label="Menu sessione"` + focus ring bianco (contrasto sul gradient)
- **Toast**: `role="status"` + `aria-live="polite"`, focus mai rubato, non blocca navigation
- **Empty state Workout**: `role="region"` + `aria-label="Sessione in sospesa"`
- **Back link Select**: `aria-label="Torna alla Home"` esplicito
- **Touch target** ≥ 40-48px su tutti gli interattivi
- **Focus visible**: outline 2px primary + offset 2px

---

# Animazioni

- Session Card / Restore Banner entrata: fade + slide-up 220ms cubic-bezier(0.4, 0, 0.2, 1)
- Toast entrata: fade + slide-up 200ms
- Badge dot: pulse infinito 1.6-2s ease-in-out (Active più veloce)
- Sheet action button: scale 0.985 su :active (120ms), background/border 160ms
- Menu button: background 160ms

Tutte azzerate con `@media (prefers-reduced-motion: reduce)`.

---

# Stati supportati

| Stato | Trigger | Rendering |
|-------|---------|-----------|
| Nessuna sessione, nessun draft in DB | `!S.active && !pending.length` | Home normale, Workout empty state "Vai in Home", FAB "Nuovo" → SelectSheet |
| Draft in memory | `S.active && sessionIsDraft(S.active)` | Session Card badge Bozza, ⋮ menu, FAB "Sessione" → Sheet |
| Active in memory | `S.active && sessionIsActive(S.active)` | Session Card badge In corso + summary, tutte azioni con conferma |
| Draft in DB (app riaperta) | `!S.active && pending Draft` | Restore Banner Home + Workout empty gate "Hai una sessione in sospeso" |
| Active in DB (app riaperta) | `!S.active && pending Active` | Restore Banner Home + Workout empty gate + conferma su discard |
| Draft `>24h` | Boot | Rimosso silenziosamente da autoCleanupOldDrafts |
| Sessione `>4h` | finishWorkout | Delegato al flow esistente `openDurationModal` (invariato) |

---

# Cosa NON fare

- Modificare la Business Logic (beginWorkout, finishWorkout, saveSetLog, etc.)
- Persistere `S.session` in IndexedDB (mai)
- Riaprire automaticamente un workout esistente al boot
- Aprire il modale `openResumeModal` al visibility change
- Mostrare Session Card + Hero "In corso" con doppia CTA (Hero non ha più CTA)
- Chiedere conferma per azioni su una Draft (nessun dato da proteggere)
- Rimuovere il flusso `openResumeModal` (resta accessibile via Profilo → "Sessioni non chiuse" per il caso `>4h`)
- Persistire query/dismiss del banner (solo runtime)
- Cambiare la posizione del FAB o duplicare la CTA "Continua"

---

# Checklist Sprint 4.5

☐ Draft detection basata unicamente su `exerciseLogs.length`

☐ FAB apre SessionSheet quando S.active esiste (non entra direttamente)

☐ SessionSheet mostra Continua/Cambia/Riavvia/Scarta con azioni contestuali

☐ Home Session Card visibile solo con S.active, sotto Hero sopra GoalCard

☐ Restore Banner visibile solo se !S.active e drafts in DB

☐ Workout tab non auto-apre sessione: empty state con Riprendi + Nuovo

☐ Draft: azioni distruttive senza conferma

☐ Active: azioni distruttive con dialog conferma

☐ Badge stato (Bozza/In corso) visibile nel WorkoutHeader

☐ Menu ⋮ nel WorkoutHeader apre lo stesso SessionSheet

☐ SelectSheet ha link "← Torna alla Home" all'inizio

☐ Cambio workout da Draft: silenzioso; da Active: dialog "Sostituire?"

☐ Toast queue con dedup, action, swipe-dismiss, safe-area

☐ Toast su discard, restore, cambio, restart

☐ Cleanup Draft `>24h` al boot (silenzioso)

☐ Nessun re-open modal al visibility change

☐ Business Logic invariata

☐ IndexedDB invariato

☐ Modello dati invariato

☐ Sacred markers tutti presenti

☐ Zero nuovi componenti in `components/` (Toast esteso, nessun nuovo file)

☐ Reduced motion azzera tutte le animazioni Sprint 4.5

---

# Obiettivo finale

L'utente apre l'app. Vede la Home.
- Se ha una sessione in corso, la Session Card la mostra chiaramente con un tap per continuare.
- Se ha una bozza dimenticata, il banner la ricorda ma non forza nessuna azione.
- Se cambia idea sulla scheda, il FAB lo porta al sheet delle azioni: continua, cambia, riavvia, scarta.
- Se scarta una bozza, sparisce senza domande. Se scarta una sessione con dati veri, il sistema chiede conferma.
- Se apre il tab Workout senza aver ripreso una sessione, vede una schermata dedicata che chiede cosa vuole fare.
- Ogni azione conferma con un toast leggero. Nessun modale invadente. Nessuna sessione persa. Nessuna scelta forzata.

L'utente è sempre in controllo. In meno di due tocchi.
