# 12 — COMPONENT TREE

Fase 6 del protocollo `09_DESIGN_EXECUTION_PROTOCOL.md`.
Documento **architetturale**, non implementativo. Traduce il Blueprint v2 ([10_NEW_DESIGN.md](10_NEW_DESIGN.md)) e la specifica Hi-Fi ([11_HI_FI_MOCKUPS.md](11_HI_FI_MOCKUPS.md)) in una libreria di componenti riutilizzabili.

Nessuna scrittura di HTML/CSS/JS in questa fase. L'obiettivo è definire: **quali componenti esistono, cosa fanno, come si compongono, come parlano tra loro**.

---

## 0. Principi di architettura

1. **Single responsibility**: ogni componente fa una cosa sola. Se descrivendone lo scopo serve la congiunzione "e", va spezzato.
2. **Composition over configuration**: preferiamo comporre 3 componenti piccoli piuttosto che avere un componente con 15 props.
3. **Presentational vs container**: distinzione netta. I *presentational* (Button, Chip, Stepper) non sanno nulla dello state globale; ricevono props e emettono eventi. I *container* (le Screen) leggono lo state e passano dati ai figli.
4. **No orfani single-use**: se un componente è usato solo in un posto e non ha una motivazione (riuso futuro, testabilità isolata, complessità interna significativa) → resta inline nel padre.
5. **Primitivi prima**: BottomSheet, FullscreenSubView, ConfirmDialog sono *primitivi base*. Le loro varianti concrete (ChangeDaySheet, SettingsSubView, ResetConfirmDialog) sono composizioni.
6. **Nomi in PascalCase**. Eventi in camelCase prefisso `on...` (nome dell'evento) o senza prefisso quando il componente li **emette** (`change`, `submit`).
7. **Zero dipendenze runtime esterne**. Stack: vanilla JS ES2020+, DOM API. Nessun framework.
8. **Coerenza col design system**: ogni componente rispetta le scale approvate (spacing 4/8/16/24/32/48; radius 16/12/8; tipografia XL/L/M/S/XS; palette Blueprint v2).

---

## 1. Component tree — vista d'insieme

```
App
├── AppLayout
│   ├── ViewSlot                  (contenitore della schermata corrente)
│   └── BottomNavigation
│       └── NavTab × 4
│
├── HomeScreen
│   ├── ContextCard               (scheda · settimana · giorno)
│   ├── PrimaryCTA                (= Button variant "dominant")
│   └── GhostCTA                  (= Button variant "ghost-m") · trigger ChangeDaySheet
│
├── WorkoutExecScreen
│   ├── ContextLine               (Blocco X/Y · Giro Z/W)
│   ├── ExerciseTitle
│   ├── Stepper × 2               (KG, REPS)
│   ├── HintText                  (target/last set — S dim)
│   ├── PrimaryCTA                (Registra ✓ / Fine sessione promosso)
│   └── SecondaryActions          (Salta · Timer manuale)
│
├── WorkoutMapScreen
│   ├── ContextLine
│   ├── SessionMeta               (durata · progresso %)
│   ├── BlockGroup × N
│   │   ├── SectionHeader
│   │   └── ExerciseRow × N       (= ListRow variant "exercise")
│   │       └── ProgressBullet
│   └── PromotedFinishCTA         (= PrimaryCTA condizionale)
│
├── ProgressScreen
│   ├── SectionHeader
│   ├── StatHero                  (numero XL + unità)
│   └── TrendBadge                (↑8% ultimi 30gg)
│
├── ProfileScreen
│   ├── SyncStatusCard
│   │   ├── StatusDot
│   │   └── RelativeTimestamp
│   ├── OpenSessionsBanner        (condizionale, se sessioni.length > 0)
│   │   └── ListRow × N
│   ├── DataActionsGroup
│   │   └── ListRow × 3           (Export · Import · Configura sync)
│   ├── AppInfoRow                (versione)
│   └── DangerZoneLink            (→ SettingsSubView)
│
├── Overlays (portati fuori dal ViewSlot)
│   ├── TimerOverlay
│   ├── ChangeDaySheet            (BottomSheet composition)
│   │   ├── SheetHeader
│   │   └── DayTile × N
│   ├── SyncConfigSheet           (BottomSheet composition)
│   │   ├── SheetHeader
│   │   ├── FormField × N
│   │   └── PrimaryCTA
│   ├── SettingsSubView           (FullscreenSubView composition)
│   │   ├── SubViewHeader
│   │   ├── SectionHeader × N
│   │   ├── ListRow × N
│   │   └── DangerButton          (= Button variant "danger")
│   └── ConfirmDialog             (Reset, Fine sessione, altri conferma)
│
└── Primitives / Foundations
    ├── Button                    (variants: dominant · ghost-m · danger · icon)
    ├── Chip                      (informativo / stato)
    ├── Stepper                   (± value con vincoli)
    ├── ContextCard               (card contesto testuale)
    ├── ContextLine               (una riga di orientamento gerarchia dim)
    ├── ListRow                   (label · value · trailing)
    ├── SectionHeader             (titolo di gruppo)
    ├── DayTile                   (giorno · stato · timestamp)
    ├── StatHero                  (numero grande + unità + caption)
    ├── TrendBadge                (indicatore % con simbolo ↑↓)
    ├── StatusDot                 (● success / warning / danger / neutral)
    ├── ProgressBullet            (✓ · • · ○)
    ├── RelativeTimestamp         (formatter "2h fa" · "ieri")
    ├── HintText                  (S dim, mono-scopo suggerimento)
    ├── SessionMeta               (metriche compatte inline)
    ├── FormField                 (label + input + validation)
    ├── BottomSheet               (primitivo sheet slide-up)
    ├── FullscreenSubView         (primitivo modale fullscreen)
    ├── ConfirmDialog             (primitivo conferma modale)
    ├── SheetHeader               (drag handle + titolo + close)
    ├── SubViewHeader             (chevron back + titolo)
    └── FocusTrap                 (utility DOM per overlay attivo)
```

---

## 2. Convenzioni trasversali

### 2.1 Naming eventi

- Eventi **user-driven** in ingresso: `onXxx` come nome della prop (`onPress`, `onChange`, `onDismiss`).
- Eventi **emessi** dal componente in astratto: nome imperativo senza prefisso (`change`, `submit`, `close`).
- Nomi vietati: `handle*` (verbo del ricevente, non del mittente), `click` (nome DOM, si preferisce `press` per intento touch-first).

### 2.2 Stato — categorie

- **Stateless**: nessun `this.state`; deriva output solo da props.
- **Stateful**: mantiene stato interno (es. valore focus, animation ticker).
- **Controlled**: il valore visibile è sempre la prop, l'utente emette `change`, il padre decide se aggiornare.
- **Uncontrolled**: il componente possiede lo stato; il padre riceve solo notifiche di cambio.

### 2.3 Responsive

Target primario: **390 × 844** (iPhone 14). L'app è mobile-first e non target desktop. Per componenti *fluidi*:
- `<= 375`: layout stretto, spacing 8/16 max.
- `376–430`: layout base (target).
- `> 430` (phablet): mantiene 430 di larghezza massima centrata.
- Ambiente tablet/desktop: consentito, non ottimizzato. Nessun breakpoint dedicato.

### 2.4 Animazioni

Vale la regola Blueprint v2 §5: **una sola curva** `cubic-bezier(0.2, 0.8, 0.2, 1)` con 3 durate ammesse (**120ms micro**, **200ms standard**, **320ms sheet/subview**).

Per ogni componente si dichiarano solo gli stati che *hanno* animazione. Assenza = nessuna animazione (comportamento default).

### 2.5 Accessibilità

Minimi non-negoziabili applicati a tutti:
- Tap target ≥ 44 × 44.
- Focus visibile via `:focus-visible` (già in Fase F).
- `prefers-reduced-motion` disattiva tutte le animazioni non essenziali.
- Ogni elemento interattivo ha nome accessibile (label testuale o `aria-label`).
- Overlay hanno FocusTrap + `aria-modal="true"` + return focus al trigger.

### 2.6 Performance

Etichette usate:
- **Memoizzabile**: output deterministico dato props → cache valida finché props uguali.
- **Lazy**: il DOM non è creato finché non è necessario (es. overlay non ancora aperti).
- **Virtualizzabile**: se la lista può superare N elementi, va renderizzata a scorrimento.
- **Cache**: risultati intermedi (es. RelativeTimestamp) memorizzati.
- **Render costoso**: da evitare in loop caldi (timer overlay tick).

---

## 3. Foundation components (primitivi)

### 3.1 App

- **Scopo**: root dell'applicazione. Instrada la view corrente, gestisce lo storage locale, monta la BottomNavigation.
- **Responsabilità**:
  - Bootstrap dell'app (caricare schede da localStorage, ripristinare tab attivo).
  - Registrare service worker PWA.
  - Espone API di navigazione (`go(viewName)`) ai figli via context/DI leggera.
  - NON contiene logica di rendering di schermate specifiche.
  - NON contiene stili — delega ad AppLayout.
- **Componenti figli**: AppLayout, tutte le Overlay (portate a livello App per z-index).
- **Componenti padre**: nessuno (root).
- **Props**: nessuna (root).
- **Eventi**: nessuno (root).
- **Stato**: Stateful. Mantiene `currentView`, `overlayStack`, `session` corrente.
- **Varianti**: nessuna.
- **Responsive**: full viewport.
- **Animazioni**: nessuna diretta.
- **Accessibilità**: definisce `lang="it"` e `<main>` landmark tramite AppLayout.
- **Performance**: singleton. Non memoizzabile per definizione.
- **Dipendenze**: localStorage API, ServiceWorker API.

---

### 3.2 AppLayout

- **Scopo**: definisce la struttura di pagina fissa: area contenuti scrollabile + bottom-nav fissa. Nessun top-bar (rimosso in Blueprint v2).
- **Responsabilità**:
  - Renderizza il ViewSlot (contenitore della schermata attiva) sopra la BottomNavigation.
  - Applica safe-area top 47 e safe-area bottom 34.
  - Gestisce il fade di transizione tra schermate (Fase F: tab-fade in `go()`).
  - NON conosce le singole schermate. Riceve un componente-view attivo.
  - NON gestisce overlay (quelli sono renderizzati a livello App).
- **Componenti figli**: ViewSlot, BottomNavigation.
- **Componenti padre**: App.
- **Props**:
  - `currentView` — **string obbligatorio** — nome tab attivo (`home`, `workout`, `progress`, `profile`).
  - `hideBottomNav` — **boolean default false** — true durante WorkoutExecScreen (Blueprint v2 §4.2).
- **Eventi**:
  - `tabChange(tabName)` — inoltrato da BottomNavigation.
- **Stato**: Stateless (controlled da App).
- **Varianti**: nessuna.
- **Responsive**: full viewport 390×844 base.
- **Animazioni**: `fadeIn(200ms)` alla view entrante (Fase F).
- **Accessibilità**: `<main aria-label="Contenuto principale">`. Bottom-nav come `<nav aria-label="Navigazione principale">`.
- **Performance**: leggero. Un re-render per cambio tab.
- **Dipendenze**: nessuna.

---

### 3.3 BottomNavigation

- **Scopo**: barra di navigazione fissa a 4 tab in basso.
- **Responsabilità**:
  - Renderizzare 4 NavTab con icona+label (Home · Workout · Progressi · Profilo).
  - Indicare visualmente il tab attivo (viola full-opacity vs dim).
  - Emettere l'evento `tabChange` al tap.
  - Nascondersi (`display: none`) quando `hidden=true` (Workout esec.).
  - NON gestisce lo stato "currentView" (lo riceve).
  - NON esegue navigazione autonomamente — emette solo l'evento.
- **Componenti figli**: NavTab × 4.
- **Componenti padre**: AppLayout.
- **Props**:
  - `activeTab` — **string obbligatorio** — nome tab.
  - `hidden` — **boolean default false**.
  - `tabs` — **array<{key, label, iconGlyph}> obbligatorio** — configurazione tab.
- **Eventi**:
  - `tabChange(tabKey)` — emesso quando l'utente tocca un NavTab non-attivo.
- **Stato**: Stateless.
- **Varianti**: `hidden` / `visible`. Nessun'altra.
- **Responsive**: altezza fissa 72px + safe-area-inset-bottom.
- **Animazioni**: fade opacità del tab-glyph al cambio attivo (120ms).
- **Accessibilità**:
  - `<nav role="tablist" aria-label="Navigazione principale">`.
  - Ogni NavTab con `role="tab"`, `aria-selected="true|false"`.
  - `aria-current="page"` sul tab attivo.
  - Tap target minimo 48 × 44.
- **Performance**: memoizzabile per `activeTab` + `tabs`.
- **Dipendenze**: nessuna.

---

### 3.4 NavTab

- **Scopo**: singolo tab della bottom-nav.
- **Responsabilità**:
  - Mostrare icona (glyph testuale — vedi Blueprint v2 §11 vietati archi decorativi ma non emoji glyph consentiti) + label M 12/500.
  - Applicare stato attivo/inattivo visuale.
  - Emettere `press` al tap.
  - NON conoscere altri tab.
- **Componenti figli**: nessuno.
- **Componenti padre**: BottomNavigation.
- **Props**:
  - `label` — **string obbligatorio**.
  - `iconGlyph` — **string obbligatorio** — es. `⌂`, `⚡`, `▤`, `◔`.
  - `active` — **boolean obbligatorio**.
- **Eventi**:
  - `press()` — al tap/click.
- **Stato**: Stateless.
- **Varianti**: `active` / `inactive`.
- **Responsive**: larghezza 1/4 della bottom-nav.
- **Animazioni**: transizione opacità 120ms tra active/inactive.
- **Accessibilità**: `role="tab"`, nome accessibile = label, `aria-selected`.
- **Performance**: memoizzabile.
- **Dipendenze**: Button base (per gestione tap+haptic) oppure implementazione dedicata leggera.

---

### 3.5 ViewSlot

- **Scopo**: contenitore del componente-schermata corrente. Isola lo swap di view.
- **Responsabilità**:
  - Renderizzare il componente figlio corrispondente a `currentView`.
  - Applicare la transizione fade in ingresso.
  - NON contiene alcuna logica applicativa.
- **Componenti figli**: uno tra {HomeScreen, WorkoutExecScreen, WorkoutMapScreen, ProgressScreen, ProfileScreen}.
- **Componenti padre**: AppLayout.
- **Props**:
  - `viewComponent` — **componente obbligatorio**.
- **Eventi**: nessuno (i figli emettono verso App tramite context).
- **Stato**: Stateless.
- **Varianti**: nessuna.
- **Responsive**: eredita larghezza da AppLayout.
- **Animazioni**: fadeIn 200ms.
- **Accessibilità**: `<main id="view">`.
- **Performance**: unmount immediato del vecchio, mount del nuovo. Nessuna cache di viste inattive.
- **Dipendenze**: nessuna.

---

## 4. Screen components

### 4.1 HomeScreen

- **Scopo**: schermata di lancio. Missione singola: "portare al Workout esec." (Blueprint v2 §4.1).
- **Responsabilità**:
  - Mostrare ContextCard con scheda · settimana · giorno correnti.
  - Mostrare PrimaryCTA "Inizia".
  - Mostrare GhostCTA "Cambia giorno" → apre ChangeDaySheet.
  - NON gestisce la selezione del giorno (delega a ChangeDaySheet + App).
- **Componenti figli**: ContextCard, PrimaryCTA, GhostCTA.
- **Componenti padre**: ViewSlot.
- **Props**:
  - `currentSelection` — **oggetto obbligatorio** `{schedaName, weekIndex, dayIndex, dayLabel, dayTypeLabel}`.
- **Eventi**:
  - `startWorkout()` — al tap PrimaryCTA.
  - `openChangeDay()` — al tap GhostCTA.
- **Stato**: Stateless (container: legge da App).
- **Varianti**:
  - `empty` — nessuna scheda caricata (mostra CTA "Importa" invece di "Inizia", vedi Blueprint v2 §12 empty-states).
  - `normal` — default.
- **Responsive**: layout centrato verticalmente entro safe-area.
- **Animazioni**: fade dei figli in ingresso (200ms) — ereditato da ViewSlot.
- **Accessibilità**: h2 nascosto visivamente per landmark ("Home").
- **Performance**: leggero.
- **Dipendenze**: nessuna.

---

### 4.2 WorkoutExecScreen

- **Scopo**: eseguire una serie. Missione singola: "registrare la serie corrente e passare oltre".
- **Responsabilità**:
  - Mostrare ContextLine con Blocco X/Y · Giro Z/W.
  - Mostrare ExerciseTitle grande.
  - Mostrare 2 Stepper (KG, REPS) con valori correnti.
  - Mostrare HintText con target/last set.
  - Mostrare PrimaryCTA: `Registra ✓` normalmente, oppure `Fine sessione` promosso quando tutti gli esercizi sono completati (Blueprint v2 §11.10).
  - Mostrare SecondaryActions (Salta, Timer manuale) come Button ghost.
  - Nascondere la BottomNavigation (Blueprint v2 §4.2).
  - NON gestire il timer di rest — lo attiva emettendo `setRegistered` verso App, che monta TimerOverlay.
- **Componenti figli**: ContextLine, ExerciseTitle, Stepper × 2, HintText, PrimaryCTA, GhostCTA × N.
- **Componenti padre**: ViewSlot.
- **Props**:
  - `session` — **oggetto obbligatorio** — sessione corrente (blocco, esercizio, serie).
  - `currentExercise` — **oggetto obbligatorio** — `{name, targetKg, targetReps, lastKg, lastReps}`.
  - `values` — **oggetto obbligatorio** — `{kg, reps}`.
  - `isLastAction` — **boolean obbligatorio** — se true, promuove CTA in "Fine sessione".
- **Eventi**:
  - `valueChange({kg, reps})` — al variare degli Stepper.
  - `setRegistered()` — al tap PrimaryCTA normale.
  - `sessionFinished()` — al tap PrimaryCTA promosso.
  - `skipExercise()`.
  - `openManualTimer()`.
- **Stato**: Controlled (i valori Stepper sono controllati dal container).
- **Varianti**:
  - `standard` — CTA "Registra ✓".
  - `promoted-finish` — CTA "Fine sessione".
- **Responsive**: layout single-column, occupa altezza intera meno safe-area.
- **Animazioni**: crossfade CTA (200ms) al passaggio standard → promoted-finish.
- **Accessibilità**:
  - h2 visivamente nascosto con nome esercizio corrente per screen reader.
  - Stepper con `aria-live="polite"` sul valore.
  - Bottom-nav rimossa dal DOM (non solo `display:none` opzionale, ma anche `aria-hidden="true"`).
- **Performance**: memoizzabile per singolo tick di UI (input dell'utente è raro).
- **Dipendenze**: nessuna.

---

### 4.3 WorkoutMapScreen

- **Scopo**: vista d'insieme della sessione in corso. Missione: "vedere a che punto sono".
- **Responsabilità**:
  - Mostrare ContextLine sessione.
  - Mostrare SessionMeta (durata trascorsa, % completamento).
  - Renderizzare BlockGroup × N con SectionHeader per ogni blocco.
  - Per ogni esercizio del blocco, mostrare ExerciseRow con ProgressBullet dello stato.
  - Mostrare PromotedFinishCTA in fondo quando tutti gli esercizi completati.
  - NON permette editing (read-only view).
- **Componenti figli**: ContextLine, SessionMeta, SectionHeader × N, ExerciseRow × N, PromotedFinishCTA (Button dominant).
- **Componenti padre**: ViewSlot.
- **Props**:
  - `session` — **oggetto obbligatorio**.
  - `blocks` — **array<Block> obbligatorio** — struttura blocchi/esercizi con stato.
  - `elapsedSeconds` — **number obbligatorio**.
  - `completionPct` — **number obbligatorio** — 0..100.
  - `allCompleted` — **boolean obbligatorio**.
- **Eventi**:
  - `resumeExercise(exerciseId)` — al tap su una ExerciseRow non completata (opzionale, vedi Blueprint v2 §11).
  - `finishSession()`.
- **Stato**: Stateless (container).
- **Varianti**:
  - `in-progress` — mostra CTA finish disabilitato o assente.
  - `all-completed` — mostra PromotedFinishCTA.
- **Responsive**: lista scrollabile verticalmente.
- **Animazioni**: nessuna specifica (i ProgressBullet non "animano" da ○ a ✓ ma cambiano di stato al re-render).
- **Accessibilità**: struttura semantica con `<section>` per blocchi e `<ol>` per esercizi.
- **Performance**: virtualizzabile se blocchi > 50 esercizi totali (limite teorico, non atteso).
- **Dipendenze**: nessuna.

---

### 4.4 ProgressScreen

- **Scopo**: mostrare una metrica principale + trend (Blueprint v2 §4.4). Missione: "una domanda, una risposta".
- **Responsabilità**:
  - Mostrare SectionHeader (opzionale) "Volume totale 30 giorni".
  - Mostrare StatHero col numero.
  - Mostrare TrendBadge con delta %.
  - NON deve diventare una dashboard (Blueprint v2 §11.14).
- **Componenti figli**: SectionHeader, StatHero, TrendBadge.
- **Componenti padre**: ViewSlot.
- **Props**:
  - `metricLabel` — **string obbligatorio** — es. "Volume totale 30 giorni".
  - `value` — **number obbligatorio**.
  - `unit` — **string obbligatorio** — es. "kg".
  - `trendPct` — **number obbligatorio** — es. +8 o -3.
  - `trendWindowLabel` — **string obbligatorio** — es. "vs 30gg precedenti".
- **Eventi**: nessuno (schermata read-only).
- **Stato**: Stateless.
- **Varianti**:
  - `empty` — nessun dato disponibile (mostra `HintText` "Registra almeno una sessione").
  - `normal`.
- **Responsive**: centrato verticalmente.
- **Animazioni**: fade in dello StatHero (200ms).
- **Accessibilità**: numero letto interamente da screen reader tramite `aria-label` esplicita composta.
- **Performance**: cache del trend calcolato lato container.
- **Dipendenze**: nessuna.

---

### 4.5 ProfileScreen

- **Scopo**: gestione sync, sessioni non chiuse, azioni sui dati. Missione: "controllo stato + accesso a impostazioni" (Blueprint v2 §4.5).
- **Responsabilità**:
  - Mostrare SyncStatusCard.
  - Mostrare OpenSessionsBanner condizionale (solo se sessioni pending esistono).
  - Mostrare DataActionsGroup con 3 ListRow (Export · Import · Configura sync).
  - Mostrare AppInfoRow con versione.
  - Mostrare DangerZoneLink → naviga a SettingsSubView (dove risiede Reset, Blueprint v2 §9.3).
  - NON contiene direttamente il pulsante Reset (segregato in SettingsSubView).
- **Componenti figli**: SyncStatusCard, OpenSessionsBanner (condizionale), DataActionsGroup, AppInfoRow, DangerZoneLink (ListRow variant).
- **Componenti padre**: ViewSlot.
- **Props**:
  - `syncStatus` — **oggetto obbligatorio** — `{state: 'connected'|'disconnected'|'error', lastSync: timestamp|null}`.
  - `openSessions` — **array obbligatorio** — sessioni non chiuse (può essere vuota).
  - `appVersion` — **string obbligatorio**.
- **Eventi**:
  - `openSyncConfig()`.
  - `exportData()`.
  - `importData()`.
  - `resumeSession(sessionId)`.
  - `openSettings()`.
- **Stato**: Stateless.
- **Varianti**:
  - `with-open-sessions` — mostra il banner.
  - `clean` — nessun banner.
- **Responsive**: lista scrollabile.
- **Animazioni**: nessuna specifica.
- **Accessibilità**: sezioni con `<section aria-labelledby>` collegate a SectionHeader.
- **Performance**: memoizzabile.
- **Dipendenze**: nessuna.

---

## 5. Overlay components

### 5.1 TimerOverlay

- **Scopo**: overlay a tutto schermo durante il rest tra serie. Missione: "countdown + next-up glimpse".
- **Responsabilità**:
  - Mostrare numero countdown MM:SS al centro (Blueprint v2 §4.6).
  - Mostrare `prossimo:` con nome esercizio successivo.
  - Applicare l'unica ombra ammessa in Hi-Fi §1.
  - Applicare `+30s` come Button ghost centrale sotto il countdown.
  - Emettere `dismiss` al tap fuori o su X.
  - NON deve permettere azioni di editing.
- **Componenti figli**: HintText (per "prossimo: ..."), Button ghost (+30s), Button icon (chiudi).
- **Componenti padre**: App (renderizzato al top di z-index).
- **Props**:
  - `remainingSeconds` — **number obbligatorio**.
  - `nextExerciseLabel` — **string obbligatorio**.
  - `onDismiss` — **function obbligatoria**.
  - `onAdd30` — **function obbligatoria**.
- **Eventi**:
  - `dismiss()`.
  - `add30()`.
  - `finished()` — quando remainingSeconds arriva a 0.
- **Stato**: Stateful — possiede il tick timer interno che scatta 1/s (uncontrolled per efficienza). Il padre passa `startSeconds` e riceve `finished`.
- **Varianti**:
  - `counting` — colore neutro.
  - `finishing` (<5s) — colore warning.
- **Responsive**: full viewport, contenuto centrato.
- **Animazioni**:
  - Ingresso: `fadeIn + scale(0.98→1)` 200ms.
  - Uscita: `fadeOut` 200ms.
  - Reduced-motion: solo opacity.
- **Accessibilità**:
  - `role="alertdialog"` (interruzione contestuale).
  - `aria-live="polite"` sul countdown.
  - FocusTrap attivo.
  - Return focus al PrimaryCTA di WorkoutExecScreen alla chiusura.
- **Performance**: render tick ogni secondo — evitare re-render di figli non correlati (isolare il numero in nodo dedicato).
- **Dipendenze**: `requestAnimationFrame` o `setInterval` (implementazione scelta in Fase 7).

---

### 5.2 BottomSheet (primitivo)

- **Scopo**: contenitore primitivo per pannelli slide-up dal basso.
- **Responsabilità**:
  - Renderizzare backdrop semitrasparente.
  - Animare l'ingresso/uscita del pannello (slide + fade backdrop).
  - Gestire dismiss (tap backdrop, drag verso il basso, ESC).
  - Applicare radius 16 solo top-left/top-right.
  - Applicare safe-area-inset-bottom al padding interno.
  - Attivare FocusTrap.
  - NON conosce il proprio contenuto — riceve children/slot.
- **Componenti figli**: SheetHeader + slot generico.
- **Componenti padre**: App (o container overlay).
- **Props**:
  - `isOpen` — **boolean obbligatorio**.
  - `onDismiss` — **function obbligatoria**.
  - `title` — **string opzionale** — passato a SheetHeader.
  - `dismissible` — **boolean default true**.
- **Eventi**:
  - `dismiss()`.
- **Stato**: Stateless (isOpen controllato dal padre).
- **Varianti**: nessuna (composizione varia via children).
- **Responsive**: largo 100% viewport; altezza cresce col contenuto fino a max 85vh.
- **Animazioni**:
  - Ingresso: pannello `translateY(100%→0)` + backdrop `opacity 0→1`, 320ms.
  - Uscita: inversa 320ms.
  - Reduced-motion: nessuno slide, solo opacity.
- **Accessibilità**:
  - `role="dialog" aria-modal="true"`.
  - `aria-labelledby` al titolo SheetHeader.
  - FocusTrap + return focus al trigger.
- **Performance**: lazy — DOM montato solo al primo `isOpen=true`, poi mantenuto con `display:none` per performance riapertura.
- **Dipendenze**: FocusTrap utility.

---

### 5.3 ChangeDaySheet (composizione)

- **Scopo**: sheet slide-up per selezionare scheda · settimana · giorno (Blueprint v2 §9.1 · Fase B).
- **Responsabilità**:
  - Comporre BottomSheet + SheetHeader "Cambia giorno" + lista DayTile.
  - Riportare la selezione corrente evidenziata.
  - Al tap su un DayTile: emettere `select(dayRef)` e dismiss.
- **Componenti figli**: BottomSheet, SheetHeader, DayTile × N.
- **Componenti padre**: App.
- **Props**:
  - `isOpen` — **boolean obbligatorio**.
  - `days` — **array<Day> obbligatorio**.
  - `currentSelection` — **oggetto obbligatorio** — `{weekIndex, dayIndex}`.
  - `onSelect` — **function obbligatoria** — `(weekIndex, dayIndex) => void`.
  - `onDismiss` — **function obbligatoria**.
- **Eventi**:
  - `select(weekIndex, dayIndex)`.
  - `dismiss()`.
- **Stato**: Stateless.
- **Varianti**: nessuna.
- **Responsive**: eredita da BottomSheet.
- **Animazioni**: ereditate.
- **Accessibilità**: eredita da BottomSheet. Lista `<ul role="listbox">` con DayTile come `role="option" aria-selected`.
- **Performance**: memoizzabile per `days` + `currentSelection`.
- **Dipendenze**: nessuna.

---

### 5.4 SyncConfigSheet (composizione)

- **Scopo**: sheet per configurare la connessione GitHub sync (Blueprint v2 §9.2).
- **Responsabilità**:
  - Comporre BottomSheet + SheetHeader + FormField × N (token, owner, repo, path) + PrimaryCTA "Salva".
  - Validare i campi (client-side minimo: non-vuoto).
  - Emettere `submit(config)` al tap salva.
- **Componenti figli**: BottomSheet, SheetHeader, FormField × N, PrimaryCTA.
- **Componenti padre**: App (aperto da ProfileScreen).
- **Props**:
  - `isOpen` — **boolean obbligatorio**.
  - `initialConfig` — **oggetto opzionale** — pre-popola i campi se esiste.
  - `onSubmit` — **function obbligatoria**.
  - `onDismiss` — **function obbligatoria**.
- **Eventi**:
  - `submit(config)`.
  - `dismiss()`.
- **Stato**: Stateful (input values interni, uncontrolled). Il padre riceve solo `submit`.
- **Varianti**:
  - `new` — nessuna config esistente.
  - `edit` — pre-popolata.
- **Responsive**: eredita.
- **Animazioni**: ereditate.
- **Accessibilità**: `<form>` con `aria-labelledby=title`. FormField hanno `<label>` associati.
- **Performance**: leggero.
- **Dipendenze**: nessuna.

---

### 5.5 FullscreenSubView (primitivo)

- **Scopo**: sotto-vista modale a tutto schermo (Blueprint v2 §11.15). Copre completamente la view corrente.
- **Responsabilità**:
  - Occupare 100% del viewport sopra la view corrente.
  - Renderizzare SubViewHeader (back chevron + titolo).
  - Contenere slot generico.
  - Gestire chiusura via back chevron (torna alla view precedente).
  - Attivare FocusTrap.
  - NON deve avere bottom-nav visibile.
- **Componenti figli**: SubViewHeader + slot.
- **Componenti padre**: App.
- **Props**:
  - `isOpen` — **boolean obbligatorio**.
  - `title` — **string obbligatorio**.
  - `onBack` — **function obbligatoria**.
- **Eventi**:
  - `back()`.
- **Stato**: Stateless.
- **Varianti**: nessuna.
- **Responsive**: full viewport.
- **Animazioni**:
  - Ingresso: `translateX(100%→0)` 320ms.
  - Uscita: inversa.
  - Reduced-motion: opacity only.
- **Accessibilità**:
  - `role="dialog" aria-modal="true"`.
  - `aria-labelledby` a SubViewHeader.
  - FocusTrap.
- **Performance**: lazy mount.
- **Dipendenze**: FocusTrap utility.

---

### 5.6 SettingsSubView (composizione)

- **Scopo**: schermata Impostazioni (Blueprint v2 §9.3) accessibile solo da Profilo. Include la danger zone (Reset).
- **Responsabilità**:
  - Comporre FullscreenSubView + SectionHeader × N + ListRow × N + DangerButton ("Reset dati") in fondo.
  - Al tap su DangerButton emette `requestReset` → App apre ConfirmDialog.
- **Componenti figli**: FullscreenSubView, SectionHeader × N, ListRow × N, DangerButton.
- **Componenti padre**: App.
- **Props**:
  - `isOpen` — **boolean obbligatorio**.
  - `onBack` — **function obbligatoria**.
  - `onRequestReset` — **function obbligatoria**.
  - `onToggle(setting, value)` — **function opzionale** — per settings toggle.
  - `settings` — **oggetto obbligatorio** — stato correnti (tema, unità, ecc.).
- **Eventi**:
  - `back()`.
  - `requestReset()`.
  - `toggle(setting, value)`.
- **Stato**: Stateless.
- **Varianti**: nessuna.
- **Responsive**: full viewport.
- **Animazioni**: ereditate.
- **Accessibilità**: eredita da FullscreenSubView.
- **Performance**: leggero.
- **Dipendenze**: nessuna.

---

### 5.7 ConfirmDialog (primitivo)

- **Scopo**: modale di conferma per azioni irreversibili (Reset, Fine sessione se aggiunto, ecc.) — Blueprint v2 §11.9.
- **Responsabilità**:
  - Renderizzare backdrop + card centrale con titolo, corpo, 2 azioni (Annulla ghost, Conferma variante appropriata).
  - Applicare focus iniziale sul bottone **non-distruttivo** (Annulla) come default sicuro.
  - Chiudersi solo via azioni (non dismiss al tap fuori — protegge azione critica).
- **Componenti figli**: Button × 2.
- **Componenti padre**: App.
- **Props**:
  - `isOpen` — **boolean obbligatorio**.
  - `title` — **string obbligatorio**.
  - `body` — **string obbligatorio**.
  - `confirmLabel` — **string obbligatorio**.
  - `cancelLabel` — **string default "Annulla"**.
  - `confirmVariant` — **string default "danger"** — passata al Button.
  - `onConfirm` — **function obbligatoria**.
  - `onCancel` — **function obbligatoria**.
- **Eventi**:
  - `confirm()`.
  - `cancel()`.
- **Stato**: Stateless.
- **Varianti**:
  - `danger` (default per Reset).
  - `standard` (per conferme non distruttive).
- **Responsive**: card 320px larga max, centrata.
- **Animazioni**: ingresso `fadeIn + scale(0.96→1)` 200ms.
- **Accessibilità**:
  - `role="alertdialog" aria-modal="true"`.
  - `aria-labelledby=title` + `aria-describedby=body`.
  - FocusTrap; focus iniziale su Cancel.
- **Performance**: lazy mount.
- **Dipendenze**: FocusTrap.

---

## 6. UI components riutilizzabili

### 6.1 Button

- **Scopo**: unica primitiva di azione. Copre tutte le CTA dell'app.
- **Responsabilità**:
  - Renderizzare label + eventuale glyph.
  - Applicare la variante stilistica ricevuta.
  - Emettere `press` al tap, gestire haptic minimale.
  - Gestire stato disabled visualmente e semantica.
  - NON contiene logica applicativa.
- **Componenti figli**: nessuno.
- **Componenti padre**: quasi tutte le screen e overlay.
- **Props**:
  - `label` — **string obbligatorio**.
  - `variant` — **string default "dominant"** — uno di `dominant | ghost-m | danger | icon`.
  - `glyph` — **string opzionale** — es. `✓`, `+`, `−`.
  - `disabled` — **boolean default false**.
  - `onPress` — **function obbligatoria**.
  - `ariaLabel` — **string opzionale** — per icon-only.
- **Eventi**:
  - `press()`.
- **Stato**: Stateless.
- **Varianti**:
  - `dominant` — full-width viola, testo bianco, altezza 56, radius 12 (CTA principale).
  - `ghost-m` — bordo sottile o solo testo M viola, altezza 44 (CTA secondaria).
  - `danger` — full-width rosso su fondo (per Reset).
  - `icon` — 44 × 44 quadrato, solo glyph (X di chiusura, ecc.).
- **Responsive**: `dominant` e `danger` full-width del container; `ghost-m` auto-width; `icon` fisso 44.
- **Animazioni**:
  - Pressed: scale(0.98) 120ms.
  - Hover (desktop opzionale): opacity 0.9.
  - Disabled: nessuna animazione, opacità ridotta.
- **Accessibilità**:
  - `<button type="button">` sempre.
  - `aria-label` obbligatorio se variant=icon.
  - `disabled` propagato all'attributo DOM.
  - Focus-visible con outline conforme al design system.
  - Tap target minimo 44 × 44 sempre.
- **Performance**: memoizzabile.
- **Dipendenze**: nessuna.

---

### 6.2 Chip

- **Scopo**: etichetta compatta per informazione stato/categoria.
- **Responsabilità**:
  - Mostrare testo breve con radius 8, background elev, padding orizzontale 8.
  - Può essere `static` (informativo) o `interactive` (emette `press`).
  - NON contiene glyph decorativi (regola Blueprint v2 §11).
- **Componenti figli**: nessuno.
- **Componenti padre**: ChangeDaySheet (accanto a DayTile potrebbe indicare status), ProfileScreen (versione, ecc.).
- **Props**:
  - `label` — **string obbligatorio**.
  - `interactive` — **boolean default false**.
  - `onPress` — **function opzionale** — richiesto se `interactive=true`.
  - `variant` — **string default "neutral"** — `neutral | success | warning | danger`.
- **Eventi**:
  - `press()` — solo se interactive.
- **Stato**: Stateless.
- **Varianti**: come `variant` prop.
- **Responsive**: auto-width fino a 100% del container.
- **Animazioni**: nessuna (se non-interactive). Se interactive, pressed scale(0.98).
- **Accessibilità**:
  - Se interactive → `<button>`.
  - Se static → `<span>`.
- **Performance**: memoizzabile.
- **Dipendenze**: nessuna.

---

### 6.3 Stepper

- **Scopo**: input numerico con incremento/decremento (Blueprint v2 §11.4 · KG/REPS).
- **Responsabilità**:
  - Mostrare `[−] valore [+]` con valore in tipografia dedicata (XL 40 per KG, L 32 per REPS).
  - Vincolare al range consentito.
  - Applicare `step` (KG: 2.5; REPS: 1) definito da props.
  - Emettere `change(value)` a ogni tap.
  - Applicare `tabular-nums` al valore.
- **Componenti figli**: 2× Button (variant icon o custom).
- **Componenti padre**: WorkoutExecScreen.
- **Props**:
  - `value` — **number obbligatorio**.
  - `min` — **number obbligatorio**.
  - `max` — **number obbligatorio**.
  - `step` — **number obbligatorio**.
  - `unit` — **string opzionale** — es. "kg" mostrato inline.
  - `size` — **string default "large"** — `large | medium` (KG vs REPS).
  - `onChange` — **function obbligatoria**.
- **Eventi**:
  - `change(newValue)`.
- **Stato**: Controlled.
- **Varianti**:
  - `large` (KG) — valore XL 40.
  - `medium` (REPS) — valore L 32.
- **Responsive**: full-width del container padre.
- **Animazioni**:
  - Bottone pressed: scale(0.98) 120ms.
  - Valore: nessuna animazione al cambio (feedback via haptic).
- **Accessibilità**:
  - `role="spinbutton" aria-valuenow aria-valuemin aria-valuemax`.
  - Bottoni con `aria-label="Diminuisci"` / `aria-label="Aumenta"`.
  - Tastiera: `ArrowUp/ArrowDown` incrementa/decrementa.
- **Performance**: memoizzabile.
- **Dipendenze**: nessuna.

---

### 6.4 ContextCard

- **Scopo**: card informativa che stabilisce il contesto della schermata (Blueprint v2 §11.5).
- **Responsabilità**:
  - Renderizzare titolo di scheda + sub-info (settimana, giorno, tipo).
  - Background bg-elev, radius 16, padding 24.
  - Read-only.
- **Componenti figli**: nessuno diretto (solo testo).
- **Componenti padre**: HomeScreen.
- **Props**:
  - `title` — **string obbligatorio**.
  - `subtitle` — **string obbligatorio**.
  - `dayLabel` — **string obbligatorio**.
- **Eventi**: nessuno.
- **Stato**: Stateless.
- **Varianti**: nessuna.
- **Responsive**: full-width padding esterno 16.
- **Animazioni**: fade in ereditato dalla screen.
- **Accessibilità**: gruppo semantico con h3 accessibile.
- **Performance**: memoizzabile.
- **Dipendenze**: nessuna.

---

### 6.5 ContextLine

- **Scopo**: singola riga di orientamento gerarchia dim, mono-scopo.
- **Responsabilità**:
  - Mostrare stringa formato "Blocco X/Y · Giro Z/W" in S 14/400 text-dim.
  - Padding verticale 8, orizzontale 16.
- **Componenti figli**: nessuno.
- **Componenti padre**: WorkoutExecScreen, WorkoutMapScreen.
- **Props**:
  - `text` — **string obbligatorio**.
- **Eventi**: nessuno.
- **Stato**: Stateless.
- **Varianti**: nessuna.
- **Responsive**: full-width.
- **Animazioni**: nessuna.
- **Accessibilità**: `<p role="status">` se aggiornato dinamicamente.
- **Performance**: memoizzabile.
- **Dipendenze**: nessuna.

---

### 6.6 ListRow

- **Scopo**: riga generica di una lista (label + valore + trailing opzionale).
- **Responsabilità**:
  - Layout 3 zone: leading (icona/glyph opzionale), main (label + descrizione), trailing (valore, chip, o simbolo).
  - Se `interactive=true` → emette `press` e ha area cliccabile completa.
  - NON deve usare simboli decorativi (regola Blueprint v2 §11 — solo `✓ • ○ ↑ ↓ ● +−`).
- **Componenti figli**: nessuno diretto; può ospitare Chip, ProgressBullet, StatusDot come trailing.
- **Componenti padre**: WorkoutMapScreen (ExerciseRow), ProfileScreen (DataActionsGroup), SettingsSubView.
- **Props**:
  - `label` — **string obbligatorio**.
  - `description` — **string opzionale**.
  - `leadingGlyph` — **string opzionale**.
  - `trailingText` — **string opzionale**.
  - `trailingComponent` — **componente opzionale** — es. Chip, StatusDot, ProgressBullet.
  - `interactive` — **boolean default false**.
  - `onPress` — **function opzionale**.
  - `destructive` — **boolean default false** — colore danger per la label.
- **Eventi**:
  - `press()` — se interactive.
- **Stato**: Stateless.
- **Varianti**:
  - `standard`.
  - `destructive`.
  - `exercise` (usa un pattern preciso: nome esercizio + progress bullet trailing).
- **Responsive**: full-width, min-height 44.
- **Animazioni**: pressed opacity 0.7 (120ms) se interactive.
- **Accessibilità**: `<button>` se interactive, `<li>` altrimenti. Nome accessibile = label + description.
- **Performance**: memoizzabile.
- **Dipendenze**: nessuna.

---

### 6.7 SectionHeader

- **Scopo**: intestazione di gruppo di elementi.
- **Responsabilità**:
  - Renderizzare titolo M 14/500 text-dim uppercase-friendly (implementazione decide se uppercase o normal case; Blueprint v2 tende a normal case).
  - Padding 8 sopra, 4 sotto.
- **Componenti figli**: nessuno.
- **Componenti padre**: ProfileScreen, SettingsSubView, WorkoutMapScreen.
- **Props**:
  - `title` — **string obbligatorio**.
- **Eventi**: nessuno.
- **Stato**: Stateless.
- **Varianti**: nessuna.
- **Responsive**: full-width.
- **Animazioni**: nessuna.
- **Accessibilità**: `<h3>` semantico; le sezioni figlie usano `aria-labelledby`.
- **Performance**: memoizzabile.
- **Dipendenze**: nessuna.

---

### 6.8 DayTile

- **Scopo**: tile riga per selezionare un giorno nella ChangeDaySheet.
- **Responsabilità**:
  - Mostrare "Giorno N" + tipo (Push, Pull, Legs...) + RelativeTimestamp opzionale (ultima esecuzione).
  - Applicare stato `selected` (bordo viola / background differente).
  - Emettere `press` al tap.
- **Componenti figli**: RelativeTimestamp (opzionale), StatusDot (opzionale).
- **Componenti padre**: ChangeDaySheet.
- **Props**:
  - `dayLabel` — **string obbligatorio** — es. "Giorno 3".
  - `dayType` — **string obbligatorio** — es. "Push".
  - `lastDoneAt` — **timestamp opzionale**.
  - `selected` — **boolean obbligatorio**.
  - `onPress` — **function obbligatoria**.
- **Eventi**:
  - `press()`.
- **Stato**: Stateless.
- **Varianti**: `selected` / `unselected`.
- **Responsive**: full-width del sheet.
- **Animazioni**: pressed opacity.
- **Accessibilità**: `role="option" aria-selected`.
- **Performance**: memoizzabile.
- **Dipendenze**: nessuna.

---

### 6.9 StatHero

- **Scopo**: numero grande + unità + caption (Blueprint v2 §4.4 · ProgressScreen).
- **Responsabilità**:
  - Numero XL 56/700 con `tabular-nums`.
  - Unità appesa in dimensione L 20/500 accanto.
  - Caption opzionale M 14/400 text-dim sotto.
- **Componenti figli**: nessuno.
- **Componenti padre**: ProgressScreen (primario), potenzialmente Home futuro.
- **Props**:
  - `value` — **number obbligatorio**.
  - `unit` — **string obbligatorio**.
  - `caption` — **string opzionale**.
  - `format` — **string default "integer"** — `integer | decimal-1`.
- **Eventi**: nessuno.
- **Stato**: Stateless.
- **Varianti**: nessuna (format è helper interno).
- **Responsive**: centrato.
- **Animazioni**: fade in (200ms) su change.
- **Accessibilità**: `aria-label` esplicita che compone valore+unità+caption per screen reader.
- **Performance**: memoizzabile.
- **Dipendenze**: `Intl.NumberFormat` per formattazione.

---

### 6.10 TrendBadge

- **Scopo**: indicatore di trend percentuale con simbolo direzionale (Blueprint v2 §4.4).
- **Responsabilità**:
  - Mostrare simbolo `↑` o `↓` + percentuale + finestra.
  - Colore success se ↑, danger se ↓, neutral se 0.
  - Simboli ammessi solo dal set §11 (freccia stretta ↑↓ è simbolo-giudizio, non decorativa).
- **Componenti figli**: nessuno.
- **Componenti padre**: ProgressScreen.
- **Props**:
  - `pct` — **number obbligatorio** — può essere negativo.
  - `windowLabel` — **string obbligatorio**.
- **Eventi**: nessuno.
- **Stato**: Stateless.
- **Varianti**: derivate dal segno di `pct` (`up | down | flat`).
- **Responsive**: inline.
- **Animazioni**: fade in con StatHero.
- **Accessibilità**: `aria-label` esplicita "aumentato del 8% rispetto ai 30 giorni precedenti".
- **Performance**: memoizzabile.
- **Dipendenze**: nessuna.

---

### 6.11 StatusDot

- **Scopo**: pallino di stato (● 8px) per indicare connessione/errore/warning.
- **Responsabilità**:
  - Renderizzare cerchio pieno colorato + eventuale label accanto.
  - Colore secondo variante (success/warning/danger/neutral).
- **Componenti figli**: nessuno.
- **Componenti padre**: ProfileScreen (SyncStatusCard), potenzialmente ListRow trailing.
- **Props**:
  - `variant` — **string obbligatorio** — `success | warning | danger | neutral`.
  - `srLabel` — **string obbligatorio** — descrittivo per screen reader.
- **Eventi**: nessuno.
- **Stato**: Stateless.
- **Varianti**: come `variant` prop.
- **Responsive**: fisso 8×8.
- **Animazioni**: nessuna (Blueprint v2 §5 vieta pulse decorativo).
- **Accessibilità**: `<span aria-label={srLabel}>` — il colore da solo non è informativo.
- **Performance**: memoizzabile.
- **Dipendenze**: nessuna.

---

### 6.12 ProgressBullet

- **Scopo**: simbolo di stato di completamento (✓ · • · ○) per elementi in lista.
- **Responsabilità**:
  - Renderizzare uno dei simboli del set consentito.
  - Colorare secondo stato (completato = success, in-progress = primary, pending = dim).
- **Componenti figli**: nessuno.
- **Componenti padre**: WorkoutMapScreen (ExerciseRow trailing).
- **Props**:
  - `state` — **string obbligatorio** — `done | current | pending`.
  - `srLabel` — **string obbligatorio**.
- **Eventi**: nessuno.
- **Stato**: Stateless.
- **Varianti**: come `state`.
- **Responsive**: fisso ~16×16.
- **Animazioni**: nessuna.
- **Accessibilità**: `<span aria-label={srLabel}>`.
- **Performance**: memoizzabile.
- **Dipendenze**: nessuna.

---

### 6.13 RelativeTimestamp

- **Scopo**: formatter di timestamp relativi ("2h fa", "ieri", "3 giorni fa") — Blueprint v2 §11.16.
- **Responsabilità**:
  - Ricevere timestamp assoluto, produrre stringa relativa.
  - Non renderizza formati assoluti (regola Blueprint v2).
  - Aggiornarsi periodicamente (interval interno) per rimanere accurata su durate lunghe.
- **Componenti figli**: nessuno.
- **Componenti padre**: ProfileScreen (SyncStatusCard), DayTile (opzionale).
- **Props**:
  - `timestamp` — **number|Date obbligatorio**.
  - `refreshIntervalMs` — **number default 60000**.
- **Eventi**: nessuno.
- **Stato**: Stateful (tick interno per aggiornamento).
- **Varianti**: nessuna.
- **Responsive**: inline.
- **Animazioni**: nessuna.
- **Accessibilità**: `<time datetime={iso}>` per SR.
- **Performance**: memoizzabile per singolo timestamp; cache di formattazione.
- **Dipendenze**: `Intl.RelativeTimeFormat`.

---

### 6.14 HintText

- **Scopo**: singola riga di suggerimento contestuale S 14/400 text-dim.
- **Responsabilità**:
  - Rendere una stringa breve mono-scopo (es. "max 65 kg · ultima 60×8").
- **Componenti figli**: nessuno.
- **Componenti padre**: WorkoutExecScreen, ProgressScreen (empty variant), TimerOverlay.
- **Props**:
  - `text` — **string obbligatorio**.
- **Eventi**: nessuno.
- **Stato**: Stateless.
- **Varianti**: nessuna.
- **Responsive**: inline.
- **Animazioni**: nessuna.
- **Accessibilità**: `<p>` semplice.
- **Performance**: memoizzabile.
- **Dipendenze**: nessuna.

---

### 6.15 SessionMeta

- **Scopo**: metriche compatte inline per WorkoutMapScreen ("34:12 · 62%").
- **Responsabilità**:
  - Mostrare 1-3 valori separati da middle-dot.
  - Tipografia M 14 tabular-nums.
- **Componenti figli**: nessuno.
- **Componenti padre**: WorkoutMapScreen.
- **Props**:
  - `items` — **array<string> obbligatorio** — es. `["34:12", "62%"]`.
- **Eventi**: nessuno.
- **Stato**: Stateless.
- **Varianti**: nessuna.
- **Responsive**: inline.
- **Animazioni**: nessuna.
- **Accessibilità**: `aria-label` esplicita che decodifica ogni item.
- **Performance**: memoizzabile.
- **Dipendenze**: nessuna.

---

### 6.16 FormField

- **Scopo**: campo di form (label + input + hint/error).
- **Responsabilità**:
  - Renderizzare `<label>` + `<input type="text|number|password">` + hint opzionale.
  - Applicare stato di errore visualmente.
  - Emettere `change(value)` al blur o input.
- **Componenti figli**: nessuno.
- **Componenti padre**: SyncConfigSheet.
- **Props**:
  - `label` — **string obbligatorio**.
  - `type` — **string default "text"** — `text | number | password`.
  - `value` — **string obbligatorio**.
  - `placeholder` — **string opzionale**.
  - `hint` — **string opzionale**.
  - `error` — **string opzionale**.
  - `onChange` — **function obbligatoria**.
- **Eventi**:
  - `change(value)`.
- **Stato**: Controlled.
- **Varianti**:
  - `standard`.
  - `error` — bordo danger.
- **Responsive**: full-width del form.
- **Animazioni**: transizione bordo colore in ingresso errore.
- **Accessibilità**: `<label htmlFor>`, `aria-invalid`, `aria-describedby=hint|error`.
- **Performance**: memoizzabile.
- **Dipendenze**: nessuna.

---

### 6.17 SheetHeader

- **Scopo**: intestazione fissa di un BottomSheet (drag handle + titolo + eventuale close).
- **Responsabilità**:
  - Renderizzare handle visivo (barra 36×4 radius 2 grey).
  - Titolo L 20/600 centrato o allineato sinistra.
  - Bottone close opzionale (Button variant icon).
- **Componenti figli**: Button (icon) opzionale.
- **Componenti padre**: BottomSheet compositions.
- **Props**:
  - `title` — **string obbligatorio**.
  - `showClose` — **boolean default false**.
  - `onClose` — **function opzionale** — richiesto se `showClose=true`.
- **Eventi**:
  - `close()`.
- **Stato**: Stateless.
- **Varianti**: nessuna.
- **Responsive**: full-width.
- **Animazioni**: nessuna.
- **Accessibilità**: `<h2 id="sheet-title">` referenziato da `aria-labelledby` del padre.
- **Performance**: memoizzabile.
- **Dipendenze**: nessuna.

---

### 6.18 SubViewHeader

- **Scopo**: intestazione di FullscreenSubView (back chevron + titolo).
- **Responsabilità**:
  - Renderizzare bottone back (Button icon con glyph `‹` — attenzione: `‹›` sono simboli-giudizio ammessi? Blueprint v2 §11 vieta frecce decorative `→ ← ◀ ▶`. Il chevron singolo `‹` per navigazione back è affordance standard iOS: uso ammesso semantico-navigazionale, non decorativo. Va formalizzato in Blueprint prima dell'implementazione).
  - Titolo L 20/600 centrato.
  - Padding 16.
- **Componenti figli**: Button (icon).
- **Componenti padre**: FullscreenSubView.
- **Props**:
  - `title` — **string obbligatorio**.
  - `onBack` — **function obbligatoria**.
- **Eventi**:
  - `back()`.
- **Stato**: Stateless.
- **Varianti**: nessuna.
- **Responsive**: full-width.
- **Animazioni**: nessuna.
- **Accessibilità**: `<h2>` con `id` referenziato; bottone `aria-label="Indietro"`.
- **Performance**: memoizzabile.
- **Dipendenze**: nessuna.

> ⚠️ Nota architetturale: il chevron `‹` per back non è formalmente elencato tra i simboli ammessi in Blueprint v2 §11. Prima della Fase 7 (implementazione), va aggiunto al glossario o sostituito con la parola "Indietro". Vedi [[verifica-finale]] punto A.

---

### 6.19 FocusTrap (utility)

- **Scopo**: utility DOM per trap del focus dentro un overlay attivo (BottomSheet, FullscreenSubView, ConfirmDialog, TimerOverlay).
- **Responsabilità**:
  - Sui `Tab` / `Shift+Tab`, mantenere il focus dentro il container.
  - Al montaggio: spostare focus al primo elemento focusabile (o all'elemento specificato).
  - Allo smontaggio: restituire focus al trigger memorizzato.
  - NON è un componente visuale — è un helper installato dal padre.
- **Componenti figli**: nessuno.
- **Componenti padre**: overlay primitivi.
- **Props (interfaccia utility)**:
  - `container` — **HTMLElement obbligatorio**.
  - `initialFocus` — **HTMLElement opzionale**.
  - `returnFocusTo` — **HTMLElement opzionale**.
- **Eventi**: nessuno.
- **Stato**: mantenuto internamente (elemento originario focus).
- **Varianti**: nessuna.
- **Responsive**: n/a.
- **Animazioni**: n/a.
- **Accessibilità**: **è** il componente accessibilità — obbligatorio su ogni overlay modale.
- **Performance**: leggero, listener singolo su `keydown`.
- **Dipendenze**: DOM API.

---

## 7. Composizioni derivate — dettaglio dipendenze

### 7.1 SyncStatusCard (composizione — usata solo in ProfileScreen)

- Composizione di ContextCard (o custom card) + StatusDot + RelativeTimestamp.
- Non estratta come componente autonomo perché usata **una sola volta** (regola §0 punto 4). Rimane inline in ProfileScreen come sotto-blocco di rendering.

### 7.2 OpenSessionsBanner (composizione — usata solo in ProfileScreen)

- Composizione di SectionHeader + ListRow × N.
- Idem: non estratto se single-use.

### 7.3 DataActionsGroup (composizione — usata solo in ProfileScreen)

- Composizione di SectionHeader + 3× ListRow interactive.
- Idem: inline.

### 7.4 BlockGroup (composizione — usata solo in WorkoutMapScreen)

- Composizione di SectionHeader + ListRow[variant=exercise] × N.
- Idem: inline. Se in futuro comparirà una schermata "dettaglio blocco" con la stessa struttura, si estrarrà.

### 7.5 ExerciseRow (composizione — usata solo in WorkoutMapScreen)

- Alias di ListRow[variant=exercise]. Non un componente separato — è una configurazione.

Queste 5 composizioni sono **elencate come pattern**, non promosse a componenti. Rispettano la regola §0.4.

---

## 8. Matrice di riuso (verifica regola "riutilizzabile in almeno 2 schermate")

| Componente | Home | WorkoutExec | WorkoutMap | Progress | Profile | Overlays | ≥ 2? |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Button | ✓ | ✓ | ✓ |   | ✓ | ✓ | ✓ |
| Chip |   |   |   |   | ✓ | ✓ | ✓ |
| Stepper |   | ✓ (×2) |   |   |   |   | riuso intra-screen ✓ |
| ContextCard | ✓ |   |   |   |   |   | single-use ✗ |
| ContextLine |   | ✓ | ✓ |   |   |   | ✓ |
| ListRow |   |   | ✓ |   | ✓ | ✓ | ✓ |
| SectionHeader |   |   | ✓ |   | ✓ | ✓ | ✓ |
| DayTile |   |   |   |   |   | ✓ (ChangeDaySheet) | single-use ✗ |
| StatHero |   |   |   | ✓ |   |   | single-use ✗ |
| TrendBadge |   |   |   | ✓ |   |   | single-use ✗ |
| StatusDot |   |   |   |   | ✓ | ✓ (ChangeDay opzionale) | ✓ (potenziale) |
| ProgressBullet |   |   | ✓ |   |   |   | single-use ✗ |
| RelativeTimestamp |   |   |   |   | ✓ | ✓ (DayTile) | ✓ |
| HintText |   | ✓ |   | ✓ (empty) |   | ✓ (Timer) | ✓ |
| SessionMeta |   |   | ✓ |   |   |   | single-use ✗ |
| FormField |   |   |   |   |   | ✓ (SyncConfig) | single-use ✗ |
| BottomSheet |   |   |   |   |   | ✓ (×2) | ✓ |
| FullscreenSubView |   |   |   |   |   | ✓ | single-use ✗ |
| ConfirmDialog |   |   |   |   |   | ✓ | single-use ✗ |
| SheetHeader |   |   |   |   |   | ✓ (×2) | ✓ |
| SubViewHeader |   |   |   |   |   | ✓ | single-use ✗ |

### 8.1 Component single-use — motivazione

I componenti marcati "single-use" restano **componenti autonomi** solo se soddisfano almeno UNO dei criteri:

- **Complessità interna significativa** che giustifica isolamento (BottomSheet, FullscreenSubView, ConfirmDialog, StatHero — tutti con animazioni e/o gestione accessibilità dedicata).
- **Potenziale di riuso futuro imminente** documentato (StatusDot potrebbe passare a ListRow trailing; TrendBadge potrebbe essere riusato in future estensioni di Progress).
- **Testabilità isolata** richiesta (FormField va testato separatamente per la validazione).

I componenti single-use che NON soddisfano nessuno di questi criteri (`ContextCard`, `DayTile`, `ProgressBullet`, `SessionMeta`, `SubViewHeader`) sono comunque promossi perché:

- **ContextCard** — pattern di card che potrà essere riusato in schermate future (Progress dettaglio, Profile identità).
- **DayTile** — costruzione strutturata (tre zone informative + stato) che vale l'astrazione.
- **ProgressBullet** — simbolo con logica di stato + colore + `srLabel` che va centralizzata.
- **SessionMeta** — pattern di rendering di sequenze `A · B · C` con accessibilità dedicata.
- **SubViewHeader** — coppia titolo+back che va incapsulata per garantire coerenza.

---

## 9. Comunicazione tra componenti — pattern

### 9.1 Screen → App

Le screen non gestiscono lo state applicativo. Emettono eventi di intento. Esempio:

- `HomeScreen` emette `startWorkout` → App decide di navigare a `WorkoutExecScreen`.
- `WorkoutExecScreen` emette `setRegistered` → App aggiorna lo stato sessione e monta TimerOverlay.
- `ProfileScreen` emette `openSettings` → App monta SettingsSubView.

### 9.2 App → Screen

App passa lo state derivato come props (unidirezionale). Nessuno store globale importato dai figli. Solo lettura via props.

### 9.3 Overlay ↔ App

Gli overlay ricevono `isOpen` + callback (`onDismiss`, `onSubmit`, `onConfirm`) da App. Non conoscono il resto dell'albero. App gestisce lo `overlayStack`.

### 9.4 Screen ↔ Overlay

Nessuna comunicazione diretta. Passano SEMPRE per App. Motivazione: overlay ristrutturabili senza toccare le screen.

---

## 10. Assunzioni implementative differite alla Fase 7

Elementi lasciati aperti volutamente perché appartengono all'implementazione, non all'architettura:

1. **Tecnica di rendering**: template letterali vs `createElement` vs micro-runtime custom. Da decidere in Fase 7.
2. **Meccanismo evento**: `dispatchEvent(CustomEvent)` vs callback props. Da decidere in Fase 7 in base al pattern scelto sopra.
3. **State container**: se singleton App con getters vs modulo `state.js` con pub/sub. Decisione Fase 7.
4. **Naming file**: gerarchia cartelle `components/`, `screens/`, `overlays/`, `primitives/`. Struttura suggerita ma non vincolante.
5. **Animazioni concrete**: valori esatti in CSS transizioni + eventuale `Web Animations API`. Fase 7.
6. **FocusTrap concreto**: implementazione custom vs libreria (esclusa per regola "zero dipendenze").

---

## 11. Verifica finale

- [x] **Nessun componente duplicato** — verificato incrociando tree (§1) e sezioni §3-6. Nessun nome ricorre come componente autonomo separato con stessa responsabilità. Le "composizioni" §7.1-7.5 sono esplicitamente NON promosse.
- [x] **Nessun componente con responsabilità multiple** — ogni "Scopo" è una singola frase senza "e" congiuntivo. Fanno eccezione controllata: App (root, per sua natura coordinatore) e le screen (container = coordinano rendering + emissione eventi).
- [x] **Gerarchia coerente** — tree §1 è consistente con dipendenze dichiarate in §3-6. App → AppLayout → ViewSlot → screen; overlay sono figli diretti di App per z-index.
- [x] **Naming coerente** — PascalCase per componenti, camelCase per props/eventi, prefisso `on` per callback in ingresso, verbo imperativo per eventi emessi.
- [x] **Componenti riutilizzabili** — matrice §8 esplicita. I single-use hanno motivazione formalizzata §8.1.
- [x] **Architettura pronta per l'implementazione** — la Fase 7 può partire dalla lista in §3-6 con nome, props, eventi, stato e dipendenze definiti.

### 11.1 Nodi aperti da chiudere prima della Fase 7

**A.** Il chevron `‹` in SubViewHeader (§6.18) non è nel glossario simboli §11 di Blueprint v2. Va aggiunto formalmente al Blueprint (con giustificazione: affordance semantico-navigazionale, non decorativo) oppure sostituito con la stringa testuale "Indietro". → Decisione richiesta prima dell'implementazione.

**B.** Il pattern icone di NavTab (§3.4) è indicato come "glyph testuale" — Blueprint v2 non specifica le icone concrete della bottom-nav. Vanno formalizzate 4 glyph coerenti tra loro (es. `⌂ ⚡ ▤ ◔`) o approvata una set alternativa. → Decisione richiesta prima dell'implementazione.

**C.** L'evento `resumeExercise` in WorkoutMapScreen (§4.3) è opzionale: Blueprint v2 non chiarisce se toccare una riga completed/pending fa qualcosa. → Decisione prodotto richiesta.

Questi tre nodi sono di specifica, non di architettura. L'architettura è coerente indipendentemente dalla decisione presa.

---

## 12. Coda

Fine documento COMPONENT_TREE.

Prossima fase: **Fase 7 — Implementazione**, che tradurrà questo albero in `index.html`, `styles.css`, `app.js` (o modulazione equivalente decisa in Fase 7). Nessun codice è stato prodotto in questa fase.
