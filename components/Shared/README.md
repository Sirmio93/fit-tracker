# Shared

Utility trasversali importate da tutte le categorie di componenti. **Non** esporta componenti visibili all'utente finale.

## Moduli

| File | Export | Uso |
|------|--------|-----|
| `helpers.js` | `esc(v)`, `cx([...])`, `attr({...})`, `clamp(n,min,max)`, `uid(prefix)` | Composizione HTML string sicura, gestione classi, attributi, ID unici. |
| `Icon.js`    | `icon(name, size)`, `iconNames` | Set canonico di icone. SVG con `currentColor` per icone Blueprint-off (`dumbbell`, `play`, `pause`, `star`, `trophy`, ...) + glifi Unicode per quelle ammesse (`up`, `down`, `check`, `plus`, `minus`, `close`, `dot`, `circle`, `disc`). |
| `Presenter.js` | `present(opts) → {close, root}` | Container modale: scrim, focus-trap, ESC, restore focus, body scroll lock, auto-dismiss. Base per `Dialog`, `BottomSheet`, `Toast`, `Snackbar`. |
| `Gestures.js` | `onSwipe(el, cb)`, `onLongPress(el, cb)`, `onDragY(el, opts)` | Handler gesture reali con soglie dai token `--gesture-*`. Ognuno ritorna una funzione di dispose. |
| `Animate.js` | `animateOnce(el, cls, tok, fb, cb)`, `afterTransition(el, cb, t)` | Orchestrazione animazioni one-shot al mount/unmount. Rispetta `prefers-reduced-motion` (durata 0 → callback sincrono). |

## Icona: come sceglierla

- Preferisci un nome semantico (`chart`, `home`, `bell`) al carattere Unicode.
- Se aggiungi un'icona nuova, valuta prima se il Blueprint §11 la ammette come glifo. Solo se **no** aggiungi un SVG in `Icon.js`.
- Ogni SVG usa `stroke="currentColor"` (o `fill="currentColor"` per glifi pieni) → tinta via `color: var(--color-*)`.

## Presenter: contratto

```js
import { present } from '../Shared/Presenter.js';
import { Dialog } from '../Feedback/Dialog.js';

const handle = present({
  html: Dialog({ title: 'Confermi?', body: 'Azione irreversibile.' }),
  kind: 'dialog',                 // dialog | bottomSheet | toast | snackbar
  scrim: true,
  dismissOnScrim: true,
  escToClose: true,
  trapFocus: true,
  autoDismissMs: null,            // per toast/snackbar impostare a --timing-toast
  onClose: () => console.log('closed')
});

handle.close();  // chiude programmaticamente
```

Il Presenter garantisce:
- Focus trap durante la vita del layer.
- ESC chiude (se `escToClose`).
- Body scroll bloccato mentre almeno un modale è attivo.
- Focus restorato al trigger che ha aperto il modale.
- Compatibile con più modali sovrapposti (contatore interno).

## Gesture: soglie

Le soglie provengono da `tokens.css`:
- `--gesture-swipeThreshold` (default 40px)
- `--gesture-longPress` (default 500ms)
- `--gesture-dragThreshold` (default 8px)
- `--gesture-doubleTap` (default 300ms)

Non hardcodare mai queste soglie: se serve un tuning diverso, aggiornare il JSON dei token.

## Regole

- ❌ Nessun handler in Shared conosce lo stato dell'app o accede al DB.
- ✅ Ogni utility riceve `HTMLElement` + callback come input.
- ✅ Ogni registrazione di listener ritorna una funzione di dispose.
