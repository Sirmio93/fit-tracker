# Navigation

Componenti di navigazione dell'app: barra fissa in basso, tab orizzontali, segmented control, header con azioni, toolbar.

## Moduli

| File | Export | Uso |
|------|--------|-----|
| `BottomNavigation.js` | `BottomNavigation(opts)`, `mountBottomNavigation(el, cb)`, `setActiveNavItem(el, id)` | Barra principale fissa in basso. |
| `TabBar.js` | `TabBar(opts)`, `mountTabBar(el, cb)` | Tab orizzontali con arrow-key navigation. |
| `Segmented.js` | `Segmented(opts)`, `mountSegmented(el, cb)` | Segmented control 2-5 opzioni. |
| `Header.js` | `Header(opts)` | Top bar con titolo, sottotitolo, slot azioni HTML. |
| `Toolbar.js` | `Toolbar(opts)` | Barra a pillola con azioni HTML in linea. |

## Contratti

### `BottomNavigation(opts)`
```js
BottomNavigation({
  items: [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'workout', label: 'Workout', icon: 'dumbbell', badge: 3 }
  ],
  active: 'home',
  ariaLabel: 'Navigazione principale'
});
```
Default items: `home / workout / progressi / profilo`. Ogni item accetta `badge` opzionale (numero o stringa).

### `mountBottomNavigation(rootEl, onSelect)`
Ritorna un dispose. `onSelect(id, ev)` viene chiamato al click di ciascun item.

### `TabBar` / `Segmented`
Entrambi ricevono `items: string[]` oppure `Array<{id, label}>`. Callback `onChange(id, index)`. Supportano **frecce ← →** e (TabBar) **Home / End** per l'accessibilità.

### `Header(opts)`
```js
Header({
  title: 'Progressi',
  subtitle: 'Settimana 32',
  actions: IconButton({ icon: 'bell', label: 'Notifiche' })   // ← passata come stringa HTML
});
```
Il campo `actions` è una **stringa HTML** deliberatamente: `Navigation/` non importa da `Buttons/` per restare indipendente. Il chiamante compone azione + slot.

### `Toolbar(opts)`
Come `Header`, `actions` può essere `string[]` o `string`.

## Regole

- Nessuna dipendenza cross-categoria (Navigation NON importa Buttons/Cards/etc.).
- Gli handler sono registrati da `mount*()` e ritornano un `dispose()`. Nessun listener globale.
- Solo Design Tokens nel CSS (verificato: nessun letterale colore/size/radius).
- A11y: `role="navigation" | tablist | banner | toolbar`, `aria-current`, `aria-selected`, `aria-label` obbligatori.
- Touch target ≥ `--touch-minimum` (44px) per ogni pulsante.
- `prefers-reduced-motion` gestito centralmente in `tokens.css` (le transition usano `--duration-*` che vanno a 0ms).
