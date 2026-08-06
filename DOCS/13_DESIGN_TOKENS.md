# DESIGN_TOKENS.md — Fit Tracker PWA
**Fase 7 · Sistema di Design Tokens definitivo**
**Versione:** 1.1.0 · aggiornata durante Fase 8 con l'estensione AMOLED
**Fonte:** [10_NEW_DESIGN.md](10_NEW_DESIGN.md) · [11_HI_FI_MOCKUPS.md](11_HI_FI_MOCKUPS.md) · [12_COMPONENT_TREE.md](12_COMPONENT_TREE.md)
**File dati:** [13_DESIGN_TOKENS.json](13_DESIGN_TOKENS.json)

---

## 0. Principi non negoziabili

1. **Single source of truth.** Ogni valore grafico — colore, spaziatura, radius, timing, ombra — proviene da `13_DESIGN_TOKENS.json`. Non esiste alcun contesto in cui sia lecito scrivere un valore hardcoded (`#7C3AED`, `16px`, `200ms`) in un componente.
2. **Naming semantico, non descrittivo.** Il nome dichiara *lo scopo*, non l'aspetto. Preferire `colors.primary` a `colors.violetHex7c3aed`; preferire `spacing.24` a `spacing.big`.
3. **Nessun duplicato.** Se due token puntano allo stesso valore per scopi identici, uno dei due va rimosso. Se lo scopo è diverso, si mantiene la separazione semantica anche a costo di valori uguali (es. `radius.card` e `radius.dialog` valgono entrambi `16px` ma restano token distinti perché evolvono indipendentemente).
4. **Estendere via versione.** Aggiungere un token = incremento minore (`1.1.0`). Cambiarne il valore = incremento minore. Rimuoverlo = incremento maggiore (`2.0.0`) e passaggio da `$deprecated`.
5. **Coerenza multi-tema.** Ogni token colore semantico espone almeno le varianti `light` e `dark`. I temi derivati (es. `amoled`) vivono in `$themeExtensions` e ereditano dal tema base sovrascrivendo solo le voci necessarie. Nessun valore grafico può essere definito esclusivamente nel CSS: se un tema richiede una nuova tonalità, il valore va prima aggiunto al JSON e poi consumato via variabile CSS. Il tema attivo è responsabilità del layer di applicazione (`[data-theme="…"]`), non del componente.
6. **Conformità Blueprint v2.** Ogni valore che entra nel sistema deve rispettare le 16 regole non negoziabili del Blueprint. In caso di conflitto: vince il Blueprint, il token va corretto.

---

## 1. Come si consumano i token

I token vivono in un file JSON puro e neutro rispetto al linguaggio. La modalità di consumo verrà definita in **Fase 8** (implementazione). Le due strategie plausibili sono:

- **CSS Custom Properties** — generare all'avvio un blocco `:root { --colors-primary: #7C3AED; ... }` più `:root[data-theme="dark"] { ... }`. I componenti usano `var(--colors-primary)`.
- **Object literal JS** — importare il JSON e leggere `tokens.colors.primary[theme]` in un motore di rendering che compone lo style inline.

Per entrambe le strategie vale la stessa regola: **un componente non deve mai importare un valore letterale dal JSON**, ma solo il riferimento simbolico (`tokens.spacing['24']`, `--spacing-24`).

Naming convention di riferimento nei componenti:

| Token JSON           | CSS Variable          | Uso JS                       |
|----------------------|-----------------------|------------------------------|
| `colors.primary`     | `--colors-primary`    | `tokens.colors.primary`      |
| `spacing.24`         | `--spacing-24`        | `tokens.spacing['24']`       |
| `radius.card`        | `--radius-card`       | `tokens.radius.card`         |
| `shadow.lg`          | `--shadow-lg`         | `tokens.shadow.lg`           |
| `animation.fast`     | `--animation-fast`    | `tokens.animation.fast`      |

---

## 2. Categorie

### 2.1 `colors`

**Descrizione.** Palette semantica completa. Ogni token semantico (background, surface, primary, ecc.) espone `{ light, dark }`. I gradienti restano tema-neutrali (unica variante).

**Sotto-categorie.**
- **Superfici** — `background`, `surface`, `surfaceElevated`, `surfaceActive`.
- **Brand** — `primary`, `primaryHover`, `secondary`.
- **Feedback** — `success`, `warning`, `error`, `info`.
- **Testo** — `textPrimary`, `textSecondary`, `textDisabled`.
- **Separatori** — `border` (contorno visibile), `divider` (linea interna sottile).
- **Layer traslucidi** — `overlay` (scrim modale), `glass` (superficie glassmorphism per nav/sheet).
- **Gradienti** — `gradientPrimary`, `gradientWorkout`, `gradientSuccess`, `gradientRecord`.

**Linee guida.**
- Usa `background` per il layer più profondo dell'app (`<body>`, viewport root). Usa `surface` per ogni card, tile, sheet header. Usa `surfaceElevated` per elementi che *fluttuano* sopra una superficie (dialog, tooltip). Usa `surfaceActive` come stato pressed/selezionato di superfici interattive.
- `primary` è viola. Un solo elemento primario per schermata (CTA dominante). Se ne servono due, uno diventa `secondary` o `Ghost`.
- `secondary` è la versione ridotta del primary: link testuali, chip attive, badge non critici. **Non è** un secondo colore brand.
- `success/warning/error/info` si usano *solo* per stati che comunicano un fatto (registrazione riuscita, quota raggiunta, sync fallito, informazione neutrale). Non usarli come decorazione.
- `textDisabled` va usato **solo** con `aria-disabled` o su elementi non focusabili. Se un elemento è solo "poco importante", usa `textSecondary`.
- `overlay` è sempre il backdrop dietro un layer modale (sheet, dialog, timer). Non è mai un colore di riempimento.
- **Gradienti**: uso limitato. Max **una** superficie con gradiente visibile per schermata. Il gradiente segnala *un momento* (hero, achievement, sessione attiva), non decora.

**Esempi.**

```
CTA dominante        → background: colors.primary
CTA dominante hover  → background: colors.primaryHover
Card scheda giorno   → background: colors.surface, border: colors.border
Testo body           → color: colors.textPrimary
Etichetta ausiliaria → color: colors.textSecondary
Divider list row     → border-top: 1px solid colors.divider
Banner sync fallito  → background: colors.error, color: colors.textPrimary (dark)
Hero home            → background: colors.gradientPrimary
Sessione attiva      → background: colors.gradientWorkout
Timer overlay scrim  → background: colors.overlay
Bottom nav glass     → background: colors.glass, backdrop-filter: blur(blur.navigation)
```

**Casi d'uso critici.**
- **Contrasto AA minimo** — ogni combinazione `textPrimary` su `background/surface/surfaceElevated` è già ≥ 4.5:1. `textSecondary` su `surface` è ≥ 4.5:1. Verificare qualsiasi altra combinazione con Lighthouse prima di introdurla.
- **Su superficie gradiente** — usare sempre `textPrimary` variante dark. Il contrasto va verificato punto per punto.

---

### 2.2 `typography`

**Descrizione.** Scala tipografica in 8 livelli, dai display giganti (56/64) al small (12/16). Valori assoluti in `px` per garantire pixel-perfect su mobile.

**Sotto-categorie.**
- **Font families** — `primary` (Inter + stack di fallback), `mono` (per codice/dati raw), `numeric` (Inter con `font-variant-numeric: tabular-nums`).
- **Scala** — `display, h1, h2, h3, title, body, caption, small`. Ogni voce definisce `fontSize + lineHeight + fontWeight + letterSpacing`.
- **Peso** — `fontWeights.{regular, medium, semibold, bold}` (400/500/600/700).
- **Utility** — `lineHeight.{tight, snug, normal, relaxed}` e `letterSpacing.{tight, normal, wide}` per casi speciali.

**Linee guida.**
- Usa la scala nominata (`typography.h2`) invece dei singoli valori (`fontSize: 32px`). La scala nominata trasporta *tutto lo stile* del livello.
- `display` è per il KPI hero della Home e del Profilo — non usarlo altrove.
- `h1/h2/h3` sono titoli di schermata e sezione. Non annidare più di 2 livelli in una singola schermata.
- `title` è per titoli di card e riga elenco. `body` è il default per il testo continuo. `caption` per etichette secondarie. `small` per timestamp e footer.
- I **numeri** (peso, ripetizioni, kg, cronometro) usano SEMPRE `fontFamily.numeric` per allineare le cifre — tabular-nums evita il "salto" dei numeri durante gli aggiornamenti live.

**Esempi.**

```
KPI hero "125 kg"          → typography.display + fontFamily.numeric
Titolo schermata Home      → typography.h1
Titolo card scheda         → typography.h3
Row list — nome esercizio  → typography.title
Row list — dettaglio       → typography.caption
Timestamp "2 ore fa"       → typography.small
Timer 01:30                → typography.h1 + fontFamily.numeric
```

**Casi d'uso critici.**
- **Testo dinamico che cambia**: usa `fontFamily.numeric` per evitare shift orizzontali durante aggiornamenti (contatore reps, kg, cronometro).
- **Iperlink inline**: non definiti come token separato. Usa `typography.body` + `color: colors.primary`.

---

### 2.3 `spacing`

**Descrizione.** Scala verticale/orizzontale a 13 step. Valori in multipli di 4 fino a 24, poi passo variabile (32, 40, 48, 56, 64, 80, 96).

**Naming.** Il numero *è* il valore in pixel. `spacing.24` = `24px`.

**Linee guida.**
- **Passo standard di layout: 4, 8, 16, 24, 32, 48.** Questi 6 valori coprono l'80% dei casi (padding card, gap flex, margin sezione). Rispettano il Blueprint v2.
- **12** — usalo solo per padding compatti di controlli densi (chip, stepper, list row secondaria). Non usarlo per gap tra sezioni.
- **20** — riservato ai bottom sheet e alle safe-area estese, dove 16 è insufficiente ma 24 rompe il ritmo.
- **40, 56, 64, 80, 96** — estensioni Fase 7 per stati speciali: hero verticale, spazio pre-CTA nella schermata di completamento, padding decorativo di banner celebrativi. **Da approvare caso per caso.**
- **Regola pratica**: se stai per usare un valore fuori scala, prima verifica se puoi ottenere lo stesso risultato con un valore in scala. In caso di dubbio, tieni il valore *più piccolo* della scala.

**Esempi.**

```
Padding interno card          → spacing.16
Gap tra card in una lista     → spacing.12
Padding orizzontale schermata → spacing.16 (mobile), spacing.24 (tablet+)
Margine tra sezioni           → spacing.32
Altezza minima area vuota     → spacing.48
Padding hero verticale        → spacing.64
```

**Casi d'uso critici.**
- **Bottom nav altezza** = `touchTarget.recommended` (48px), padding verticale = `spacing.8`.
- **Sheet header padding** = `spacing.16` verticale, `spacing.24` orizzontale, `spacing.20` bottom per l'handle.

---

### 2.4 `radius`

**Descrizione.** Raggi di arrotondamento coerenti con il Blueprint (`16 / 12 / 8`) più utility.

**Token semantici.**
- `small` (8) — chip, badge, stepper.
- `medium` (12) — pulsante ghost, list row selezionata.
- `large` (16) — card, dialog, ctA dominante.
- `xl` (24) — bottom sheet (angoli superiori).
- `pill` (999) — chip attivi, tag stato.
- `fab` (999) — floating action button circolare.
- `card` (16) — alias semantico di `large`, usato dai componenti Card.
- `dialog` (16) — alias per dialog e modali.
- `bottomSheet` (24) — alias per BottomSheet (solo top corners).

**Linee guida.**
- Usa gli **alias semantici** (`radius.card`, `radius.dialog`, `radius.bottomSheet`) nei rispettivi componenti. Se il Blueprint cambia la forma del componente Card, si aggiorna `radius.card` senza toccare i componenti primitivi.
- Non introdurre valori intermedi (10, 14, 20). Se un componente sembra chiederlo, ripensa la geometria.

---

### 2.5 `shadow`

**Descrizione.** 7 preset di ombra: dalla `sm` per rilievo minimo alla `floating` per pulsanti CTA sospesi con tint viola.

**Token.**
- `none` — nessuna ombra (default).
- `sm / md / lg / xl` — scala progressiva per elevazione statica.
- `glass` — ombra dedicata a superfici glass (bottom nav, top bar).
- `floating` — ombra tint viola per CTA dominanti e FAB in stato di riposo.

**Linee guida.**
- Le ombre non sostituiscono i bordi. Su tema chiaro, elementi elevati mantengono `border: 1px solid colors.divider` + ombra.
- L'ombra viola (`floating`) usa `rgba(124,58,237,0.24)` per suggerire il colore brand del pulsante sottostante. Non usarla per elementi non-primary.
- In tema scuro le ombre sono meno visibili: compensa con `surfaceElevated` (colore più chiaro) invece di aumentare l'ombra.

---

### 2.6 `elevation`

**Descrizione.** Combinazione atomica di `zIndex` + `shadow` per ogni livello di elevazione UI. Usa **elevation invece di zIndex+shadow separati** quando è possibile.

**Livelli.**
| Livello | zIndex | Shadow    | Uso                              |
|---------|--------|-----------|----------------------------------|
| 0       | 0      | none      | In-flow.                         |
| 1       | 1      | sm        | Card statica, row selezionata.   |
| 2       | 2      | md        | Card interattiva, hover.         |
| 3       | 3      | lg        | Bottom sheet, sticky bar.        |
| 4       | 4      | xl        | Dialog, popover.                 |
| 5       | 5      | xxl (32)  | Timer overlay, fullscreen view.  |

**Linee guida.** Elevation è una scala **logica**, non un `z-index` reale nel DOM. Per lo `z-index` effettivo dei layer modali usa `zIndex.sheet / dialog / overlay` (categoria 2.13).

---

### 2.7 `animation`

**Descrizione.** Durate + curve Bézier per ogni transizione. Il Blueprint v2 impone una **curva unica** (`curveDefault`); le altre tre esistono per casi eccezionali documentati.

**Durate.**
- `fast` (120ms) — micro-interazioni: hover, ripple, feedback press.
- `normal` (200ms) — default: apertura sheet, fade tab, entrata card.
- `slow` (320ms) — transizioni ampie: full-screen entry, hero morph.
- `extraSlow` (500ms) — celebrazione: PR, completamento sessione. **Massimo 1 istanza attiva per schermata.**

**Curve.**
- `curveDefault` — `cubic-bezier(0.2, 0.8, 0.2, 1)` — **standard**. Usa questa per il 95% dei casi.
- `curveEaseOut` — `cubic-bezier(0, 0, 0.2, 1)` — solo per uscita elementi (fade-out toast).
- `curveSpring` — `cubic-bezier(0.34, 1.56, 0.64, 1)` — bounce dedicato al pulsante primario dopo un long-press. **Da approvare caso per caso.**
- `curveSharp` — `cubic-bezier(0.4, 0, 0.6, 1)` — per elementi che devono scomparire velocemente (dismiss dialog on-tap-outside).

**Regola d'oro.** Se non sei sicuro, usa `animation.normal + animation.curveDefault`. Il Blueprint dice così.

**Esempi.**

```
Apertura BottomSheet:  transform 320ms cubic-bezier(0.2, 0.8, 0.2, 1)
Fade tab:              opacity 200ms cubic-bezier(0.2, 0.8, 0.2, 1)
Ripple pulsante:       transform 120ms cubic-bezier(0.2, 0.8, 0.2, 1)
Toast dismiss:         opacity 200ms cubic-bezier(0, 0, 0.2, 1)
PR celebrazione:       scale 500ms cubic-bezier(0.34, 1.56, 0.64, 1)
```

**Rispetto di `prefers-reduced-motion`.** Ogni componente che usa animazioni **deve** disabilitarle sotto reduced-motion. In quel caso: durata `0ms`, curva ininfluente. Vedi [12_COMPONENT_TREE.md §2](12_COMPONENT_TREE.md).

---

### 2.8 `opacity`

**Descrizione.** 5 valori di trasparenza semantici per stati e overlay.

- `disabled` (0.40) — elemento non interattivo.
- `overlay` (0.50) — scrim modale su tema chiaro (per dark, vedi `colors.overlay.dark`).
- `hover` (0.08) — riempimento hover su bottone ghost.
- `pressed` (0.12) — riempimento pressed su bottone ghost.
- `focus` (0.24) — ring focus-visible attorno a un controllo (alone viola trasparente).

**Linee guida.** Applica sempre `opacity` come **layer separato** (pseudo-elemento o sfondo semi-trasparente), non come `opacity` globale del componente — l'opacity globale rende trasparente anche il testo, degradando la leggibilità.

---

### 2.9 `blur`

**Descrizione.** Valori `backdrop-filter: blur(...)` per superfici traslucide.

- `glass` (20px) — superfici glassmorphism generiche.
- `navigation` (24px) — bottom nav.
- `dialog` (40px) — sfondo dialog quando si sfoca il contenuto sotto.
- `sheet` (24px) — bottom sheet.
- `overlay` (8px) — leggera sfumatura sul contenuto sotto un timer overlay.

**Linee guida.** `backdrop-filter` è costoso su alcuni dispositivi Android datati. In caso di FPS drop, degrada a `background` opaco (`colors.surface`) — non tentare di ridurre il blur.

---

### 2.10 `breakpoints`

**Descrizione.** 6 punti di rottura per media query. Mobile-first: il breakpoint è **min-width**.

- `mobileSmall` (360px) — smartphone piccoli (iPhone SE, Android compatti).
- `mobile` (390px) — **baseline canonico** (iPhone 14).
- `mobileLarge` (430px) — iPhone Pro Max e phablet Android.
- `tablet` (768px) — iPad portrait.
- `desktop` (1024px) — iPad landscape, laptop compatto.
- `wide` (1440px) — desktop full-HD.

**Linee guida.** Il progetto è mobile-first. Ogni componente è disegnato per `mobile` (390) e verifica la sua tenuta a `tablet` (768). `desktop` e `wide` non sono target primari — l'app resta centrata a max-width tablet.

---

### 2.11 `safeArea`

**Descrizione.** Alias per `env(safe-area-inset-*)` — riservano lo spazio per notch, home indicator e barre di sistema.

- `top` — inset superiore (notch, isola dinamica).
- `bottom` — inset inferiore (home indicator).
- `horizontal` — inset laterali (landscape su iPhone).

**Linee guida.**
- Il layout root applica `padding-top: safeArea.top` e `padding-bottom: safeArea.bottom`.
- Bottom nav usa `padding-bottom: safeArea.bottom` per non essere coperta dall'home indicator.
- Bottom sheet: `padding-bottom: max(spacing.24, safeArea.bottom)`.

---

### 2.12 `icons`

**Descrizione.** Dimensioni box-quadrato per glyph e icone.

- `small` (16) — inline nel testo.
- `medium` (20) — chip, bottom nav.
- `large` (24) — CTA, header.
- `xl` (32) — hero, empty state.

**Linee guida.** Le icone del progetto sono glifi testuali (vedi Blueprint v2 §11). `icons.small/medium` allineano il glifo al `line-height` del testo circostante.

---

### 2.13 `touchTarget`

**Descrizione.** Dimensioni minime di area cliccabile. Vincolo Blueprint: **44×44 minimo**, sempre.

- `minimum` (44px) — soglia assoluta (Apple HIG, WCAG 2.5.5).
- `recommended` (48px) — default per pulsanti list, chip, tab.
- `fab` (56px) — floating action button.
- `button` (44px) — alias di `minimum` per bottoni testuali inline.

**Regola invariante.** Nessun elemento interattivo può avere dimensione visiva o hit-area inferiore a `touchTarget.minimum`. Se il glyph è più piccolo, il container espande il padding fino a raggiungere il target.

---

### 2.14 `zIndex`

**Descrizione.** Scala di stacking layer. **Usa solo questi valori** — nessun `z-index: 9999` sparso nel codice.

| Token       | Valore | Uso                                                |
|-------------|--------|----------------------------------------------------|
| base        | 0      | In-flow.                                           |
| dropdown    | 100    | Menu contestuali.                                  |
| sticky      | 200    | Header sticky, sotto-header di sezione.            |
| navigation  | 300    | Bottom nav, top bar.                               |
| sheet       | 400    | Bottom sheet e scrim relativo.                     |
| dialog      | 500    | Modali di conferma e scrim relativo.               |
| toast       | 600    | Snackbar/toast temporanei.                         |
| tooltip     | 700    | Tooltip sopra tutto tranne overlay.                |
| overlay     | 800    | Timer overlay fullscreen, loading blocker.         |

**Regola invariante.** Un componente **non** può inventare uno `z-index` fuori da questa scala. Se serve un nuovo livello, si aggiunge un token (versione minor).

---

### 2.15 `timing`

**Descrizione.** Durate di visibilità e ritardi per notifiche temporanee. Distinto da `animation` (che riguarda solo le transizioni).

- `toast` (4000ms) — auto-dismiss toast di conferma.
- `snackbar` (5000ms) — auto-dismiss snackbar (con action).
- `tooltip` (200ms) — delay prima della comparsa on hover.
- `dialog` (200ms) — durata dell'apertura dialog (fade+scale).
- `animation` (200ms) — alias per la durata default di transizione (vedi anche `animation.normal`).

---

### 2.16 `gesture`

**Descrizione.** Soglie e timing per gesti touch. Servono a rendere consistenti swipe, long-press e drag tra componenti.

- `swipeThreshold` (40px) — distanza minima orizzontale/verticale perché un pan diventi swipe.
- `longPress` (500ms) — durata pressione perché scatti long-press (menu contestuale, riordino).
- `doubleTap` (300ms) — finestra massima tra due tap per essere considerati double-tap.
- `dragThreshold` (8px) — spostamento minimo prima che un tap si trasformi in drag (evita drag involontari).

---

### 2.17 `$themeExtensions`

**Descrizione.** Temi derivati che estendono `light` o `dark` sovrascrivendo solo un sottoinsieme di token. Meccanismo per introdurre nuovi temi (AMOLED, high-contrast, seasonal) senza duplicare l'intero elenco colori né aprire deroghe CSS-only.

**Regola invariante.** Un `[data-theme="X"]` esiste nel CSS solo se `X` è dichiarato in `$themeExtensions`. Il CSS costruisce il tema derivato applicando prima i valori del tema base (`extends`), poi le sovrascritture (`overrides`). Nessun valore grafico può nascere direttamente nel CSS.

**Voci attuali.**

- **`amoled`** — pure-black per display OLED.
  - `extends`: `dark`
  - `overrides.colors`: `background #000000`, `surface #0A0A0A`, `surfaceElevated #141414`, `surfaceActive #1F1F1F`, `border #1F1F22`, `divider #141416`, `overlay rgba(0,0,0,0.85)`, `glass rgba(10,10,10,0.72)`
  - Tutto il resto (`primary`, `textPrimary`, `success/warning/error`, gradienti, ecc.) resta identico a `dark`.
  - **Uso**: risparmio energetico su OLED, richiesta esplicita dell'utente. Non è tema di default.

**Come aggiungere un nuovo tema.**
1. Aggiungere una voce in `$themeExtensions.<nome>` con `description`, `extends` e `overrides`.
2. Il generatore di `tokens.css` produce automaticamente `[data-theme="<nome>"] { … }` copiando i valori del tema base e applicando gli override.
3. Aggiungere il tema al selettore del theme switcher (Sandbox → toolbar tema).
4. Nessun override di componente: se il tema derivato "sembra rompere" un componente, il fix va nei token, non nel componente.

---

## 3. Token Blueprint-canonical vs Fase 7 extensions

Alcuni token estendono la scala originaria del Blueprint v2. Sono esplicitati qui per essere approvati/rimossi consapevolmente.

| Categoria    | Valori canonici Blueprint       | Estensioni Fase 7                       |
|--------------|---------------------------------|-----------------------------------------|
| `spacing`    | 4, 8, 16, 24, 32, 48            | 12, 20, 40, 56, 64, 80, 96              |
| `radius`     | 8, 12, 16                        | 24 (xl), 999 (pill/fab)                 |
| `animation`  | 120/200/320 + curveDefault      | extraSlow 500ms + curveEaseOut/Spring/Sharp |
| `colors`     | primary, success, warning, danger, bg-app, bg-elev, text-primary, text-dim, separator | secondary, info, gradients, glass, overlay |
| `shadow`     | (non definito)                   | intera scala sm→xl + glass + floating   |
| `elevation`  | (non definito)                   | intera scala 0→5                        |
| `blur`       | (non definito)                   | intera scala 5 livelli                  |

**Regola.** Un valore "estensione" può essere usato solo se il caso d'uso è esplicitamente approvato nel Blueprint (o in un addendum). In assenza di caso d'uso reale, il token resta nel JSON come *riservato* ma **non deve** comparire nei componenti implementati.

---

## 4. Verifica di conformità

Prima di considerare stabile una release di token, verificare:

- [ ] Ogni colore ha coppia `light`/`dark` (esclusi gradienti).
- [ ] Ogni combinazione `textPrimary` × `background|surface|surfaceElevated` supera **AA 4.5:1** (verificato con contrast checker).
- [ ] Nessun valore duplicato accidentalmente (es. due token diversi con lo stesso hex e stesso scopo).
- [ ] Naming coerente: `camelCase` per categorie e proprietà, numero puro come chiave in `spacing`, alias semantici in `radius`.
- [ ] JSON valido (`JSON.parse` non lancia).
- [ ] Ogni componente del [12_COMPONENT_TREE.md](12_COMPONENT_TREE.md) può essere stilizzato esclusivamente con questi token.
- [ ] Nessun valore hardcoded è più necessario in Fase 8.

---

## 5. Token deprecati e changelog

**Deprecati.** Nessuno. Se in versioni future un token viene rimosso, migra in `$deprecated` con `{ replacement: "colors.newName", removedIn: "2.0.0" }` e resta leggibile per un ciclo di release.

**Changelog.**
- **1.1.0** (Fase 8) — Aggiunto blocco `$themeExtensions` con tema `amoled` derivato da `dark`. Aggiornato principio 5 (multi-tema) e §2.17. Nessun token esistente modificato o rimosso.
- **1.0.0** (Fase 7) — Prima release stabile.

---

## 6. Nodi aperti (da chiudere prima della Fase 8)

- **Contrasto AA su `textSecondary` in tema chiaro.** `#5A5A62` su `#F5F5F7` = 6.7:1 — OK. Su `#EDEDF0` (surfaceActive light) = 6.2:1 — OK. Ma su un ipotetico `surface` più tinto va ri-verificato.
- **Gradienti in reduced-motion.** Devono restare gradienti statici o degradare a tinta unita? Decisione richiesta da UX prima di Fase 8.
- **Curva `curveSpring`.** Fase 7 la include ma il Blueprint v2 impone curva unica. Confermare: (a) rimuoverla, (b) mantenerla riservata solo alla celebrazione PR, (c) documentarla come deroga.
- **Blur su Android low-end.** Confermare strategia di fallback: attualmente il documento suggerisce degrado a `colors.surface` opaco. Definire soglia (device memory? user agent?).

---

## 7. Roadmap post-Fase 7

- **Fase 8 — Implementazione layer di token.** Generazione automatica di CSS custom properties + object JS da `13_DESIGN_TOKENS.json`. Da definire: tool (script Node? build manuale?) e formato output.
- **Fase 9 — Sostituzione hardcoded.** Refactor incrementale di `styles.css` e `app.js` per rimpiazzare valori letterali con riferimenti a token.
- **Fase 10 — Enforcement.** Regola di lint (`stylelint` custom o grep pre-commit) che rifiuta hex, `px` fuori scala, `cubic-bezier` non canoniche.

---

**Fine documento — Fase 7 chiusa.**
Nessun codice, nessun componente, nessuna modifica ai file esistenti del progetto.
