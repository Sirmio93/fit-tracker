# 09_PROFILE_SETTINGS.md

Versione 1.0 (Sprint 7 · 2026-08-06)

---

# Filosofia

Il Profilo non è una pagina di impostazioni: è l'hub personale dell'utente.

Ogni azione è a portata di uno o due tocchi. Tutto ciò che è mostrato funziona davvero — quello che non è ancora disponibile è persistito ma etichettato come "In arrivo". Nessuna promessa marketing, nessuna sezione decorativa.

---

# Decisioni Sprint 7 (2026-08-06)

Approvate dall'utente e vincolanti per ogni futura modifica al Profilo.

1. **Preferenze wired selettive**
   - Wired end-to-end: Tema, AMOLED, Riduzione animazioni, Dimensione testo, Unità peso (label-only)
   - Persistite + badge "In arrivo": Focus Mode default, Rest timer default, Vibrazione, Suoni
   - Tutte in `localStorage.prefs` (unico JSON blob)
   - Le preferenze non wired vengono salvate ora e collegate ai loro flussi in sprint futuri
   - Ogni preferenza non wired mostra un piccolo badge discreto ("In arrivo") senza disabilitare l'interruttore

2. **Nome utente localStorage + fallback**
   - Ordine priorità: `user.name` (localStorage) → account futuro → GitHub owner → "Atleta"
   - Dialog "Modifica nome" con validazione (1–30 caratteri, trim, no caratteri di controllo)
   - Toast di conferma al salvataggio
   - Avatar: iniziale + colore deterministico (gradient primary)
   - Prima esecuzione: se `user.name` non esiste ma GitHub è configurato → precompila con `cfg.owner` (memorizzato via `user.namePrefilledAt`)

3. **Quick Actions al posto di Ricerca/Preferiti**
   - Barra "Azioni rapide" in cima: Cambia tema, Cambia nome, Esporta, Importa (+ Continua/Elimina sessione se `S.active`)
   - Riduce il numero di tap per le operazioni più frequenti
   - No ricerca impostazioni (troppo poche impostazioni, valutare quando > 25)
   - No preferiti recenti (stato persistente per poco valore)

4. **No Cloud/Premium placeholder**
   - Le impostazioni mostrano SOLO funzionalità realmente disponibili
   - Cloud/Premium verranno aggiunti quando esisteranno davvero
   - Sezioni dinamiche: ogni gruppo appare solo se contiene contenuto reale
   - Esperienza pulita, no false aspettative

---

# Vincoli

NON modificare:

- Business Logic (`beginWorkout`, `finishWorkout`, `toggleExerciseSet`, `toggleRound`, `logFor`, `persistActive`, `saveSetLog`, `topPRs`, `completedSessions`, `sessionVolume`, `sessionSetsDone`, `newPRsInSession`)
- IndexedDB `fit-circuit-tracker-v18-optional-day` v2 (nessuna nuova store, nessuna migrazione)
- Modello dati sessioni/esercizi/schede
- Algoritmi (progressione, calcolo volume, streak, PR)
- BottomNavigation
- Home v3 / Workout v4 / Progress v5 / Storico Sprint 6 / Session Lifecycle Sprint 4.5

Aggiungere esclusivamente:

- `S.prefs` — reducedMotion, textSize, weightUnit, focusDefault, restDefaultSec, vibration, sounds (persistita in `localStorage.prefs`)
- `S.user` — name (persistito in `localStorage.user.name`)
- `S.profile` — infoDialog/nameDialog handle (transient)
- `applyPrefs()` accanto ad `applyTheme()` (root data-attrs: `data-reduced-motion`, `data-text-size`, `data-weight-unit`)
- Helper puri (`getPref`, `setPref`, `resetPrefs`, `findPrefDef`, `getUserName`, `sanitizeUserName`, `setUserName`, `initFirstBootUser`, `daysOfUse`, `profileTotalSets`, `profileTotalVolume`, `profilePRCount`, `profileLastWorkoutLabel`, `weightUnitLabel`)
- Renderer (`profileHeroHtml`, `profileQuickActionsHtml`, `profileSessionCardHtml`, `profileStatsHtml`, `profilePreferencesHtml`, `profileDataOpsHtml`, `profileInfoHtml`, `profilePendingBannerHtml`, `profileActiveCardInfoHtml`, `themeControlHtml`, `prefControlHtml`, `profileInfoRow`)
- Action functions (`profileEditName`, `profileSaveName`, `profileCycleTheme`, `profileSetTheme`, `profileTogglePref`, `profileSetPref`, `profileResetPrefs`, `openNameDialog`, `openInfoDialog`, `profileOpenInfo`)
- 7 nuovi `data-action` in `mountViewDelegation`
- Nuovo blocco CSS `SPRINT 7 — PROFILE & SETTINGS v1` in `styles.css`
- 3 nuovi hook globali su `<html>`: `data-reduced-motion`, `data-text-size`, `data-weight-unit`

---

# Struttura DOM

```
#view (tab profilo)
└── .profileV2
    ├── .profileV2__hero                          (nome + avatar + KPI + CTA)
    ├── .profileV2__banner   (opzionale)          (Banner "Sessioni non chiuse")
    ├── .profileV2__section .profileV2__quick     (Azioni rapide)
    ├── .profileV2__section .profileV2__session   (Sessione in corso — se S.active)
    ├── .profileV2__section .profileV2__stats     (StatisticCard × 4)
    ├── .profileV2__section .profileV2__card      (Scheda attiva)
    ├── .profileV2__section .profileV2__prefs     (Preferenze × 3 gruppi)
    ├── .profileV2__section .profileV2__data      (Gestione dati × 3 card)
    └── .profileV2__section .profileV2__info      (Informazioni)

Dialog / Sheet:
├── openNameDialog       (input testo + validazione)
├── openInfoDialog(kind) (licenses/privacy/terms/contacts)
├── openConfirmDialog    (per Ripristina impostazioni)
└── openResumeModal      (invariato — accessibile via Banner "Sessioni non chiuse")
```

---

# State

```js
S.prefs = {
    reducedMotion: false,          // wired  → data-reduced-motion su <html>
    textSize: 'md',                // wired  → data-text-size su <html> (sm|md|lg)
    weightUnit: 'kg',              // wired  → data-weight-unit su <html> (kg|lbs) label-only
    focusDefault: true,            // pending badge "In arrivo"
    restDefaultSec: 60,            // pending badge "In arrivo" (chip 30/45/60/75/90)
    vibration: false,              // pending badge "In arrivo"
    sounds: false                  // pending badge "In arrivo"
};

S.user = { name: '' };             // localStorage.user.name (getUserName ha fallback)
S.profile = { infoDialog: null, nameDialog: null };  // handle transient
```

Tutto lettura/scrittura tramite `getPref` / `setPref` / `getUserName` / `setUserName`. Persistenza automatica in localStorage.

---

# Helper puri

Zero side-effect, zero IndexedDB, deterministici.

**User name:**
- `getUserName()` → `user.name` || `cfg.owner` || `'Atleta'`
- `getUserNameSource()` → `'custom' | 'github' | 'default'`
- `sanitizeUserName(raw)` → trim, remove control chars, max 30 chars
- `setUserName(raw)` → sanitizza + persiste + aggiorna S.user
- `initFirstBootUser()` → chiamata al boot: se `user.name` mancante ma `cfg.owner` presente e mai fatto prefill → precompila
- `userInstalledDate()` → `localStorage.user.installedAt` (fallback: prima sessione)
- `daysOfUse()` → giorni dall'installazione (min 1)

**Preferenze:**
- `getPref(key)` → valore corrente
- `setPref(key, value)` → aggiorna S.prefs + persiste + applyPrefs
- `resetPrefs()` → torna ai default + rimuove localStorage
- `findPrefDef(key)` → ritorna definizione da `PREF_DEFS`

**Statistiche profilo:**
- `profileTotalSets()` → somma `sessionSetsDone` su completed
- `profileTotalVolume()` → somma `sessionVolume` su completed
- `profilePRCount()` → somma `newPRsInSession.length` su completed
- `profileLastWorkoutDate()` / `profileLastWorkoutLabel()` → "Oggi", "Ieri", "N giorni fa", "N settimane fa", data breve
- `weightUnitLabel()` → 'kg' | 'lbs'

---

# Renderer

- `profileHeroHtml()` → avatar iniziale + nome + meta (workout/giorni) + CTA "Modifica nome" + 3 KPI (Workout / Giorni / Ultimo)
- `profileQuickActionsHtml()` → grid `auto-fill minmax(88px, 1fr)` con 4 azioni fisse + 2 context-aware (Continua/Elimina sessione se `S.active`)
- `profileSessionCardHtml()` → renderizzata solo se `S.active`. Riuso `sessionLabel`, `sessionStatusBadgeHtml`, `sessionSummaryLine` (Sprint 4.5)
- `profileStatsHtml()` → `UI.StatisticCard × 4` (Workout completati, Serie completate, Volume totale, Record personali). Ritorna vuoto se tutti a 0
- `profileActiveCardInfoHtml()` → `UI.SettingsRow` per la scheda attiva + CTA "Apri →" (delegata a `open-select`)
- `profilePreferencesHtml()` → 3 gruppi (`Aspetto`, `Workout`, `Accessibilità`) generati da `PREF_DEFS`. Per Aspetto: Tema segmented (system/light/dark/amoled) → wired
- `themeControlHtml()` → segmented tema con 4 opzioni
- `prefControlHtml(def)` → row generica: switch | segmented | chips
- `profileDataOpsHtml()` → GitHub sync + Backup locale + Zona pericolosa. Nessuna voce disabilitata
- `profileInfoHtml()` → Versione + 4 righe con CTA "Apri" (licenses/privacy/terms/contacts)
- `profilePendingBannerHtml()` → banner "Sessioni non chiuse" (esistente, riusato)

---

# Actions

**Nome utente:**
- `profileEditName()` → apre `openNameDialog`
- `profileSaveName()` → sanitize + `setUserName` + closeModal + toast + render
- `openNameDialog()` → dialog custom con input + hint accessibile + Enter=submit, autofocus, delegation locale su `profile-save-name`

**Preferenze:**
- `profileCycleTheme()` → ciclo system→light→dark→amoled + `applyTheme` + toast + render
- `profileSetTheme(theme)` → set diretto (usato dalla segmented Tema)
- `profileTogglePref(key)` → invertes bool switch + toast wired/pending diverso + render
- `profileSetPref(key, value)` → set per segmented/chips + toast wired/pending
- `profileResetPrefs()` → conferma dialog + reset + toast

**Info:**
- `profileOpenInfo(kind)` → `openInfoDialog(kind)` per licenses/privacy/terms/contacts

---

# Flusso primo avvio

```
Store.open
loadSyncConfig
initFirstBootUser()
    ├── se manca user.installedAt → set now()
    └── se manca user.name && cfg.owner && mai prefill fatto
        └── precompila user.name = sanitizeUserName(cfg.owner)
mountViewDelegation
refresh
importPlan(EMBEDDED_SCHEDA) se S.cards vuoto
migrateDedupExercises
autoCleanupOldDrafts (Sprint 4.5)
```

User che non usa GitHub → "Atleta" fino a quando non modifica.
User con GitHub configurato → nome autoprecompilato con owner alla prima esecuzione, modificabile in qualsiasi momento senza perdere la personalizzazione.

---

# Preferenze wired vs pending

| Pref | Group | Wired | Effetto |
|------|-------|-------|---------|
| Tema | Aspetto | ✅ | `S.theme` + `applyTheme()` (esistente) |
| Riduzione animazioni | Aspetto | ✅ | `<html data-reduced-motion="true|false">` + CSS globale azzera transizioni/animazioni |
| Dimensione testo | Aspetto | ✅ | `<html data-text-size="sm|md|lg">` + CSS `:root` `font-size: 14|16|18` |
| Unità peso | Workout | ✅ | Solo etichetta (StatisticCard Volume + futuri log). Nessun ricalcolo storico |
| Focus Mode default | Workout | ⏳ In arrivo | Persistita, collegata a `beginWorkout()` in sprint futuro |
| Rest timer default | Workout | ⏳ In arrivo | Persistita, collegata a `startRestTimer()` in sprint futuro |
| Vibrazione | Accessibilità | ⏳ In arrivo | Persistita, collegata a completions in sprint futuro |
| Suoni | Accessibilità | ⏳ In arrivo | Persistita, collegata a completions in sprint futuro |

Le pending mostrano un badge visibile "In arrivo" senza disabilitare l'interruttore — l'utente le può già configurare e l'app le conserva.

---

# Quick Actions

Barra in cima a Preferenze, sempre visibile.

```
[◐ Tema]  [✎ Nome]  [↓ Esporta]  [↑ Importa]  ...  ([▶ Continua] [🗑 Elimina])
```

- **Cambia tema** → cicla system → light → dark → amoled → system (toast conferma)
- **Cambia nome** → apre dialog nome
- **Esporta** → riusa `export-all`
- **Importa** → riusa `import-json`
- Se `S.active`:
  - **Continua sessione** → riusa `session-continue`
  - **Elimina sessione** → riusa `session-discard` (conferma se Active, silente se Draft)

Le azioni context-aware compaiono solo se ha senso. Non appare mai un'azione senza effetto.

---

# Dialog

**Modifica nome** — input `#profileNameInput`, `maxlength=30`, hint accessibile che diventa error se validazione fallisce. Enter salva. Escape chiude (via Presenter). Autofocus + select all.

**Informazioni** — 4 dialog uniformi (licenses/privacy/terms/contacts). Solo copy statico, nessun link esterno per rispettare offline-first.

**Ripristina impostazioni** — `openConfirmDialog` (Sprint 4.5) con tone danger. Chiama `resetPrefs()`.

**Reset scheda** — `confirmReset()` (esistente, invariato).

---

# Accessibilità

- **Hero** — `role="region"` + `aria-label="Profilo utente"`; nome in `<h2>`; avatar `aria-hidden="true"` (informazione già in hero name)
- **Quick Actions** — button `aria-label` esplicito; icona `aria-hidden="true"`
- **Session Card** — `role="region"` + `aria-labelledby`; menu `aria-label="Apri opzioni sessione"`
- **Stats grid** — riuso `UI.StatisticCard` (accessibile)
- **Preferences** — riga con label descrittivo; switch `role="switch"` + `aria-checked`; segmented `role="group"` + `aria-pressed` per stato attivo; chips uguale
- **Info list** — button `data-info` con label chiara; dialog dedicati
- **Name dialog** — input con label collegata; hint `aria-live="polite"`; Enter submit
- **Touch target** ≥ 40px (quick buttons 72px min-height, switch 44×26, segmented buttons 32px min-height)
- **Focus visible** 2px primary outline + offset 2px
- **Reduced motion** azzera tutte le transizioni Sprint 7

---

# Animazioni

- Quick button hover: background 160ms ease
- Quick button active: scale(0.98) 120ms
- Switch thumb: translateX 160ms
- Segmented/chip active: box-shadow morbido
- Nome dialog input focus: border-color + box-shadow 160ms
- Hero avatar: nessuna animazione, colore gradiente statico
- Reduced motion (prefs OR media query): tutte azzerate

---

# Stati supportati (dinamici)

| Condizione | Rendering |
|------------|-----------|
| Nessuna sessione, nessuna scheda | Hero + Quick + Stats vuoti (nascosti) + Preferenze + Data + Info |
| S.active Draft | Hero + Banner (opz) + Quick (con azioni sessione) + Session Card + Stats + Card + Preferenze + Data + Info |
| S.active Active | come sopra ma summary line "N min · N serie" |
| Sessioni non chiuse in DB | Banner warning con "Gestisci →" (invariato) |
| Nessuna scheda | Card sezione nascosta |
| Nessun workout completato | Stats sezione nascosta (evita `0 0 0 0`) |
| GitHub non configurato | Card GitHub in Gestione dati con badge "non configurato" e details `open` |
| GitHub configurato + status ok | Card GitHub con badge verde + details `closed` |
| Preferenza pending | Badge "In arrivo" giallo + toast "Preferenza salvata · disponibile in un prossimo aggiornamento" |

---

# Cosa NON fare

- Modificare la Business Logic (sacred markers invariati)
- Persistire `S.prefs` in IndexedDB (solo localStorage)
- Mostrare sezioni Cloud/Premium fittizie
- Mostrare "Preferiti recenti" o "Ricerca impostazioni"
- Aggiungere voci disabilitate senza motivo
- Modificare i dati storici quando cambia l'unità peso (label-only, nessun ricalcolo)
- Rimuovere il flusso `openResumeModal` (accessibile via Banner "Sessioni non chiuse")
- Modificare Home / Workout / Progress / Storico / Rest overlay / Session Lifecycle

---

# Checklist Sprint 7

☐ `S.prefs` inizializzato da localStorage al boot con defaults sicuri

☐ `applyPrefs()` chiamato al boot per hookare data-attrs su `<html>`

☐ `S.user.name` inizializzato da localStorage con sanitize

☐ `initFirstBootUser()` prefille il nome con `cfg.owner` alla prima esecuzione con GitHub configurato

☐ `data()` (tab profilo) renderizza `profileV2` composta da 9 sezioni dinamiche

☐ Hero con avatar iniziale + nome + KPI + CTA Modifica nome

☐ Quick Actions grid con 4-6 azioni context-aware

☐ Session Card visibile solo se `S.active` (riuso Sprint 4.5)

☐ Statistiche personali con 4 StatisticCard, nascoste se tutte a 0

☐ Preferenze: Tema segmented + 7 righe da `PREF_DEFS` in 3 gruppi

☐ Preferenze pending: badge "In arrivo" + toast informativo al toggle

☐ Preferenze wired (reducedMotion/textSize/weightUnit) applicate immediatamente

☐ Gestione dati: GitHub + Esporta/Importa + Danger Zone (Ripristina impostazioni + Reset scheda)

☐ Informazioni: 5 righe (Versione + 4 dialog)

☐ Nome dialog con validazione, Enter=submit, toast conferma

☐ Info dialog uniformi per licenses/privacy/terms/contacts

☐ Business Logic invariata (12/12 sacred markers)

☐ IndexedDB invariato

☐ Modello dati invariato

☐ Zero nuovi componenti in `components/` (riuso completo Foundation)

☐ Reduced motion (prefs OR media query) azzera animazioni Sprint 7

---

# Obiettivo finale

L'utente apre il tab Profilo. Vede:
- Il proprio nome e avatar in cima, con KPI immediati (workout, giorni, ultimo).
- 4 azioni rapide sempre pronte + 2 contestuali quando ha una sessione in corso.
- Se ha una sessione, la card gliela ricorda con Continua e menu opzioni.
- Le proprie statistiche personali.
- Le proprie preferenze, con quelle "In arrivo" già configurabili ma etichettate onestamente.
- Backup e reset raggiungibili in un tocco.
- Info app senza distrazioni.

Un profilo che rispetta il tempo dell'utente. Ciò che è disponibile funziona davvero. Ciò che sarà disponibile è già persistito, in attesa del suo sprint.
