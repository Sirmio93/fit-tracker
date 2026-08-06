# Buttons

Componenti interattivi primari. Tutti hanno touch target ≥ `--touch-minimum` (44px) e supportano lo stato `is-loading`.

## Moduli

| File | Export | Uso |
|------|--------|-----|
| `Button.js` | `Button(opts)` | Bottone standard con label. |
| `IconButton.js` | `IconButton(opts)` | Bottone quadrato solo-icona; richiede `label` per screen reader. |
| `Fab.js` | `Fab(opts)` | Floating Action Button (circolare o extended). |

## Varianti

- `primary` (default) — sfondo `--color-primary`, testo `--color-textOnPrimary`.
- `secondary` — sfondo `--color-secondary`.
- `ghost` — sfondo trasparente, bordo, testo `--color-primary`.
- `danger` — sfondo `--color-error`.

Modificatori: `floating` (ombra a tint viola), `fullWidth` (100% width).

## Taglie

- `sm` — altezza `--touch-minimum`, font caption.
- `md` — altezza `--touch-recommended` (default).
- `lg` — altezza `--touch-fab`, font title.

## Stati

| Stato | Come si attiva |
|-------|----------------|
| Default    | — |
| Hover      | `:hover` |
| Pressed    | `:active` o `.is-pressed` |
| Focus      | `:focus-visible` — box-shadow con `--opacity-focus` |
| Disabled   | `disabled` o `.is-disabled` — opacity `--opacity-disabled` |
| Loading    | `.is-loading` + `aria-busy` — spinner al centro |

## Esempi

```js
import { Button } from './Buttons/Button.js';
import { IconButton } from './Buttons/IconButton.js';
import { Fab } from './Buttons/Fab.js';

root.innerHTML =
  Button({ label: 'Continua', variant: 'primary' }) +
  Button({ label: 'Annulla',  variant: 'ghost',  size: 'sm' }) +
  Button({ label: 'Elimina',  variant: 'danger', icon: 'close', iconPosition: 'start' }) +
  IconButton({ icon: 'settings', label: 'Impostazioni' }) +
  Fab({ icon: 'plus', label: 'Nuovo allenamento', extended: true, text: 'Nuovo' });
```

## Regole

- Nessun listener registrato: il chiamante attacca `click` sul root o via delegate.
- Nessuna dipendenza cross-categoria (usa solo `Shared/`).
- Le icone provengono da `Shared/Icon.js`. Se serve una glifo non presente, aggiungerla lì (mai in-file).
- `IconButton.label` è **obbligatoria**: senza, il bottone non è accessibile agli screen reader.
