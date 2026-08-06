# Feedback

Componenti che comunicano stati temporanei o permanenti all'utente: dialog, bottom sheet, toast, snackbar, banner, skeleton, stati vuoti/errore/successo.

## Moduli

| File | Export | Uso |
|------|--------|-----|
| `Dialog.js`       | `Dialog(opts)`, `showDialog(opts)`             | Modale di conferma (via Presenter). |
| `BottomSheet.js`  | `BottomSheet(opts)`, `showBottomSheet(opts)`   | Sheet dal basso con drag-to-dismiss (via Presenter + Gestures). |
| `Toast.js`        | `Toast(opts)`, `showToast(opts)`               | Notifica temporanea (auto-dismiss 3s). |
| `Snackbar.js`     | `Snackbar(opts)`, `showSnackbar(opts)`         | Notifica con azione (auto-dismiss 5s). |
| `Banner.js`       | `Banner(opts)`                                 | Banner in-page persistente (info/warning/error/success). |
| `Skeleton.js`     | `Skeleton(opts)`                               | Placeholder shimmer generico. |
| `StateEmpty.js`   | `StateEmpty(opts)`                             | Full-panel stato vuoto. |
| `StateError.js`   | `StateError(opts)`                             | Full-panel stato d'errore (role="alert"). |
| `StateSuccess.js` | `StateSuccess(opts)`                           | Full-panel stato di successo. |

## Pattern template + show

I componenti modali sono esposti in **due forme**:

- `Dialog(opts)` → ritorna la stringa HTML, utile per test/screenshot e composizione custom.
- `showDialog(opts)` → monta il template via `Shared/Presenter.js`, gestisce scrim, focus-trap, ESC, restore focus, body scroll lock.

## Esempi

```js
import { showDialog }     from './Feedback/Dialog.js';
import { showBottomSheet }from './Feedback/BottomSheet.js';
import { showToast }      from './Feedback/Toast.js';
import { showSnackbar }   from './Feedback/Snackbar.js';
import { Button }         from './Buttons/Button.js';

// Dialog di conferma
const handle = showDialog({
  title: 'Eliminare sessione?',
  body:  'Questa azione non può essere annullata.',
  actions:
    Button({ variant: 'ghost',  label: 'Annulla', dataset: { action: 'cancel' } }) +
    Button({ variant: 'danger', label: 'Elimina', dataset: { action: 'confirm' } }),
  onClose: () => console.log('dialog chiuso'),
});
// Il chiamante ascolta il click via delegate su handle.root.

// Bottom sheet con drag-to-dismiss
showBottomSheet({
  title: 'Scegli allenamento',
  content: '<div class="c-stack">...</div>',
  onClose: () => {}
});

// Toast/Snackbar
showToast({ variant: 'success', message: 'Set salvato' });
showSnackbar({ message: 'Set eliminato', action: 'ANNULLA', onAction: () => restore() });
```

## Regole

- **Presenter è l'unico responsabile** di scrim/focus-trap/ESC/scroll-lock. I componenti non re-implementano queste responsabilità.
- **Business logic zero**: nessuna scrittura su DB, nessun `fetch()`, nessun timer applicativo. Le callback ricevute (`onAction`, `onClose`) sono passate al chiamante.
- Solo Design Tokens nel CSS; animazioni solo `opacity` + `transform`.
- `StateError` usa `role="alert"` per essere annunciato dagli screen reader.
- `BottomSheet` disabilita `touch-action` per abilitare il drag; il grip cambia cursore (grab/grabbing).
