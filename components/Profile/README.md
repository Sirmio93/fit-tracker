# Profile

Componenti della schermata Profilo: avatar, header profilo, badge trofei, righe impostazioni, interruttore preferenza.

## Moduli

| File | Export | Uso |
|------|--------|-----|
| `Avatar.js`            | `Avatar(opts)`                                     | Cerchio con iniziali o immagine; taglie sm/md/lg/xl. |
| `ProfileHeader.js`     | `ProfileHeader(opts)`                              | Card con Avatar XL, nome, meta, slot azioni. |
| `AchievementBadge.js`  | `AchievementBadge(opts)`                           | Trofeo con icona, titolo, meta; stato `locked`. |
| `SettingsRow.js`       | `SettingsRow(opts)`                                | Row impostazione con label, meta, control custom. |
| `PreferenceSwitch.js`  | `PreferenceSwitch(opts)`, `mountPreferenceSwitch(el, cb)` | Toggle ARIA `role="switch"`. |

## Contratti

### `Avatar`
Taglie: `sm | md | lg | xl` (default `md`). Se `image` è passato, sostituisce le iniziali con `<img>` (con `alt`). Se `ariaLabel` è omesso, l'avatar è `aria-hidden="true"` (decorativo).

### `ProfileHeader`
Composto internamente con `Avatar({size:'xl'})`. `actions` è HTML string.

### `SettingsRow`
Il control è determinato in ordine:
1. `opts.control` (HTML custom).
2. `opts.switch: boolean` → `PreferenceSwitch` inline (ATTENZIONE: la label è collegata via `aria-labelledby`, ma il mount va fatto separatamente se serve reagire al toggle).
3. Chevron di default (icona `arrow` ruotata −90°).

Per rendere la riga interamente cliccabile, passare `interactive: true` (aggiunge `role="button"`, `tabindex=0`, `aria-label=label`). Usare `dataset` per identificare quale riga è stata cliccata.

### `PreferenceSwitch`
Il toggle emette `onChange(on)` in `mount`. Supporta anche `Space` / `Enter` da tastiera.

```js
import { PreferenceSwitch, mountPreferenceSwitch } from './Profile/PreferenceSwitch.js';

root.innerHTML = PreferenceSwitch({ on: true, label: 'Vibrazione al set completato' });
const dispose = mountPreferenceSwitch(root.querySelector('.c-switch'), on => {
  savePreference('vibration', on);
});
```

## Esempi

```js
import { ProfileHeader } from './Profile/ProfileHeader.js';
import { SettingsRow }   from './Profile/SettingsRow.js';
import { AchievementBadge } from './Profile/AchievementBadge.js';

root.innerHTML =
  ProfileHeader({ name: 'Marta B.', initials: 'MB', meta: 'Livello avanzato · 62 sessioni' }) +
  SettingsRow({ label: 'Notifiche',    switch: true }) +
  SettingsRow({ label: 'Sincronizza GitHub', meta: 'Ultimo sync: ieri', interactive: true, dataset: { action: 'sync' } }) +
  AchievementBadge({ icon: 'trophy',  title: '10 PR',   meta: 'Continua così!' }) +
  AchievementBadge({ icon: 'star',    title: 'Streak 30', meta: 'Bloccato', locked: true });
```

## Regole

- L'unica dipendenza cross-categoria è `Shared/`. `SettingsRow` importa `PreferenceSwitch` dalla stessa cartella (consentito).
- Solo Design Tokens nel CSS.
- Il touch target minimo (row cliccabile, switch) rispetta `--touch-recommended`.
- `Avatar` decorativo è `aria-hidden="true"`; se rappresenta l'identità dell'utente in isolamento, passare `ariaLabel`.
