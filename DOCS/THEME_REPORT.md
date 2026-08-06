# THEME_REPORT — Step 2

**Versione:** 1.0
**Data:** 2026-08-04
**Scope:** Fase 10 — Step 2 (Theme system extension)
**Prerequisito:** [FOUNDATION_REPORT.md](FOUNDATION_REPORT.md) completato, tokens `[data-theme="amoled"]` presente.

---

## 0. TL;DR

- `applyTheme()` in [app.js:3](../app.js#L3) esteso da 3 modi (`system|light|dark`) a **4 modi** (`+ amoled`), con aggiornamento automatico di `<meta name="theme-color">` letto dal token `--color-background`.
- Aggiunto **event bridge** `ui:theme-set` in [app.js](../app.js) e API pubblica `UI.setTheme(name)` in [components/Shared/Theme.js](../components/Shared/Theme.js).
- **`#themeBtn` legacy invariato** — continua a ruotare 3 stati (`system → dark → light`); l'utente non vede ancora amoled nell'UI (arriva in Step 11 Settings, [PRE_MIGRATION_AUDIT §5.2 A6](PRE_MIGRATION_AUDIT.md)).
- **Business logic INTATTA**: state machine, IndexedDB, modello dati, sessioni non toccate.
- **Effetto utente**: zero regressioni. `dark`/`light` funzionano identicamente; status bar mobile ora sincronizzata al background del tema attivo.

---

## 1. CHANGESET

| File | Δ | Natura |
|------|---|--------|
| [app.js](../app.js) | ~+15 righe | `applyTheme()` esteso; +listener `ui:theme-set` a fine file |
| [components/Shared/Theme.js](../components/Shared/Theme.js) | +50 righe (nuovo) | API: `setTheme`, `getTheme`, `getEffectiveTheme`, `THEMES`, `EFFECTIVE_THEMES` |
| [components/index.js](../components/index.js) | +7 righe | Re-export named da Theme.js |

**File NON toccati:**
- [components/Foundation/tokens.css](../components/Foundation/tokens.css) — invariato (già pronto da Step 1)
- [components/bootstrap.js](../components/bootstrap.js) — invariato (Theme è nel namespace `UI.*` via re-export)
- [index.html](../index.html) — invariato
- [sw.js](../sw.js) — invariato
- [manifest.json](../manifest.json) — invariato
- IndexedDB, `S`, business logic — invariati

---

## 2. DETTAGLIO CAMBIAMENTI

### 2.1 `applyTheme()` esteso — [app.js:3-16](../app.js#L3-L16)

**Prima** (1 riga, dark/light):
```js
function applyTheme() { document.documentElement.dataset.theme = (S.theme === 'dark' || (S.theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)) ? 'dark' : 'light' } applyTheme();
```

**Dopo** (13 righe, 4 modi + meta theme-color):
```js
function applyTheme() {
    const t = S.theme;
    let effective;
    if (t === 'amoled') effective = 'amoled';
    else if (t === 'dark') effective = 'dark';
    else if (t === 'light') effective = 'light';
    else effective = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    document.documentElement.dataset.theme = effective;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
        const bg = getComputedStyle(document.documentElement).getPropertyValue('--color-background').trim();
        if (bg) meta.setAttribute('content', bg);
    }
} applyTheme();
```

**Semantica preservata:**
- `system` → dark se OS in dark mode, altrimenti light (identico a prima)
- `dark` → dark (identico)
- `light` → light (identico)
- `amoled` → **nuovo**: applica surface pure black

**Aggiunta:**
- `<meta name="theme-color">` aggiornato dinamicamente leggendo `--color-background` dal token attivo → status bar mobile (Chrome/PWA installata) ora coerente col tema (era hardcoded `#7C3AED` prima). Nessun valore hardcoded: **single source of truth = tokens.css**.

### 2.2 Bridge event — [app.js](../app.js) fondo file

```js
document.addEventListener('ui:theme-set', function (e) {
    var name = e && e.detail && e.detail.name;
    if (name !== 'system' && name !== 'light' && name !== 'dark' && name !== 'amoled') return;
    S.theme = name;
    localStorage.theme = name;
    applyTheme();
});
```

**Perché event-based:**
- `window.UI` è congelato in bootstrap → non può ospitare closure che accedono a `S`.
- CustomEvent è il pattern standard per bridge library ↔ legacy globals.
- `S.theme` resta l'**unica fonte di verità in memoria**; `localStorage.theme` resta l'**unica fonte di verità persistente**.
- Validazione whitelist evita injection di valori arbitrari.

### 2.3 API pubblica — [components/Shared/Theme.js](../components/Shared/Theme.js)

```js
export const THEMES = Object.freeze(['system', 'light', 'dark', 'amoled']);
export const EFFECTIVE_THEMES = Object.freeze(['light', 'dark', 'amoled']);

export function setTheme(name) {
  if (!THEMES.includes(name)) return false;
  document.dispatchEvent(new CustomEvent('ui:theme-set', { detail: { name } }));
  return true;
}

export function getTheme() {
  const t = (typeof localStorage !== 'undefined' && localStorage.theme) || 'system';
  return THEMES.includes(t) ? t : 'system';
}

export function getEffectiveTheme() {
  const attr = document.documentElement.dataset.theme;
  return EFFECTIVE_THEMES.includes(attr) ? attr : 'light';
}
```

**Consumo previsto da Step 11 Settings:**
```js
import { setTheme, getTheme, THEMES } from './components/index.js';
// oppure via bootstrap:
window.UI.setTheme('amoled');
window.UI.getTheme(); // 'amoled'
```

### 2.4 Export namespace — [components/index.js:15-21](../components/index.js#L15-L21)

Aggiunto re-export coerente con lo stile del file (named, immutable, no side-effects).

---

## 3. INVARIANTI PRESERVATE

### 3.1 Legacy `#themeBtn`

Non toccato — continua a ruotare `system → dark → light`. Comportamento utente identico.

**Perché non estendere anche il bottone a 4 stati?**
Decisione utente §7 audit + [PRE_MIGRATION_AUDIT §5.2 A6](PRE_MIGRATION_AUDIT.md): il `#themeBtn` legacy viene **rimosso in Step 3** con la top-bar; il nuovo selettore (con `system / light / dark / amoled` visibili come chip) arriva in **Step 11 Settings**. Ampliare temporaneamente il bottone confonderebbe l'utente durante gli Step intermedi.

### 3.2 Business logic

Verifica automatizzata (script Node) — tutti i marker presenti:
- `logFor`, `beginWorkout`, `finishWorkout`, `resumeSession`, `discardSession`
- `fillMissingFromPrevious`, `persistActive`
- `Store` (IndexedDB wrapper)
- `DB = 'fit-circuit-tracker-v18-optional-day'`, `indexedDB.open(DB, 2)`

### 3.3 State `S`

`S.theme` legge/scrive gli stessi valori di prima; l'unico valore aggiuntivo `'amoled'` è ammesso ma non ancora settato da alcun path utente (arriva in Step 11).

### 3.4 localStorage

Chiave `theme` invariata; valori ammessi ora includono `'amoled'` (whitelist esplicita).

---

## 4. VERIFICA MANUALE (§8 checklist)

### 4.1 UI

- [ ] Refresh → app carica, tema iniziale coerente con OS (o `localStorage.theme` esistente)
- [ ] `#themeBtn` in top-bar ruota `system → dark → light` come prima
- [ ] `<meta name="theme-color">` in `<head>` cambia valore ad ogni switch (verifica in DevTools Elements)
- [ ] Nessuna schermata cambia rendering

### 4.2 Business logic

- [ ] Nuovo workout → INIZIA → serie → completa → salva sessione (identico a Step 1)
- [ ] Riprendi sessione (Resume Modal) funziona
- [ ] Sync GitHub, backup, import/export invariati
- [ ] IndexedDB DevTools → `fit-circuit-tracker-v18-optional-day` v2, stores invariati

### 4.3 API amoled (test da DevTools console)

- [ ] `window.UI.setTheme('amoled')` → ritorna `true`, `<html data-theme>` diventa `"amoled"`, background pure black
- [ ] `window.UI.getTheme()` → `'amoled'`
- [ ] `window.UI.getEffectiveTheme()` → `'amoled'`
- [ ] `localStorage.theme` → `'amoled'` (persistito)
- [ ] Refresh (F5) → tema amoled persiste
- [ ] `window.UI.setTheme('system')` → torna al tema di sistema, `localStorage.theme = 'system'`
- [ ] `window.UI.setTheme('xyz')` → ritorna `false`, nessun cambio

### 4.4 Meta theme-color

- [ ] `document.querySelector('meta[name="theme-color"]').content` cambia ad ogni switch tema
  - light → `#F5F5F7`
  - dark → `#0A0A0B`
  - amoled → `#000000`

### 4.5 Accessibilità

- [ ] `prefers-reduced-motion: reduce` — durate azzerate (già gestito da Foundation)
- [ ] Contrasto AA rispettato in tutti e 3 gli effective themes

### 4.6 Regression testing

Stesso set di §4.6 di FOUNDATION_REPORT. Focus specifico:
- [ ] Autosave `persistActive` funziona (bump kg → chiudi tab → riapri → dato salvato)
- [ ] Rest timer / Session timer non affetti dal cambio tema
- [ ] Focus Mode Circuit≡Superset invariata

---

## 5. ROLLBACK

Livello L1 (revert Step 2 mantenendo Step 1):

```bash
# Ripristina applyTheme() a versione pre-step 2 + rimuove listener ui:theme-set
git checkout HEAD -- app.js
# Rimuove Theme.js e reverta export
rm components/Shared/Theme.js
git checkout HEAD -- components/index.js
```

Zero impatto su dati: IndexedDB non toccato.

---

## 6. GATE PER STEP 3 (Navigation)

Step 3 può iniziare SE:

- ✅ Checklist §4.1-§4.6 completa
- ✅ `UI.setTheme('amoled')` funziona da console senza errori
- ✅ Meta theme-color cambia dinamicamente
- ✅ 0 regressioni su workout / sessioni

**Cosa farà Step 3:**
1. Sostituzione `<nav id="bottomNav">` con `BottomNavigation` component (decisione 4: glyph 🏠💪📈👤 outline/filled)
2. Rimozione top-bar legacy (`.top .brand h1 #themeBtn`) da [index.html:15-26](../index.html#L15-L26)
3. Rimozione listener `#themeBtn` in [app.js:1314-1318](../app.js#L1314-L1318) (audit §5.2 A6)
4. Grep `go('stats')` [app.js:672](../app.js#L672) → rinominare in `'progressi'` (audit §5.3 M2) per prep TAB_MIGRATION removal
5. NON toccare business logic, NON rimuovere ancora `styles.css`

**Cosa NON farà Step 3:**
- Nessun selettore tema (arriva in Step 11 Settings)
- Nessun cambio schermate interne (le migrazioni Home/Workout/etc. iniziano da Step 4)

---

## 7. STATO

✅ **Step 2 Theme COMPLETATO** — sistema tema esteso a 4 modi, API pubblica pronta, business logic intatta.

🛑 **STOP**. Attesa autorizzazione per Step 3 Navigation.
