# Cards

Contenitori informativi. Tutti costruiti sopra `Card.js` (base) tramite lo slot `extra` per contenuti specifici.

## Moduli

| File | Export | Uso |
|------|--------|-----|
| `Card.js`          | `Card(opts)`          | Base con eyebrow/title/body/footer/extra. Opzionale `interactive` per role="button". |
| `HeroCard.js`      | `HeroCard(opts)`      | Gradient hero (sessione in corso). |
| `WorkoutCard.js`   | `WorkoutCard(opts)`   | Gradient viola→magenta (sessione attiva). |
| `StatisticCard.js` | `StatisticCard(opts)` | KPI grande con valore, unità, delta. |
| `HistoryCard.js`   | `HistoryCard(opts)`   | Row compatta con avatar, titolo, meta, badge. |
| `RecordCard.js`    | `RecordCard(opts)`    | Personal Record (gradient dorato). |
| `GoalCard.js`      | `GoalCard(opts)`      | Progress bar + hint. `progress` 0-100. |
| `EmptyCard.js`     | `EmptyCard(opts)`     | Stato vuoto con icona centrale e CTA opzionale. |
| `LoadingCard.js`   | `LoadingCard(opts)`   | Skeleton con `lines` (1-6). |
| `ExerciseCard.js`  | `ExerciseCard(opts)`  | Lista di set (n × reps × weight, check completato). |

## Contratto comune

Tutte le card accettano opzionalmente:

- `interactive: true` → `tabindex=0`, `role="button"`, `aria-label` richiesta.
- `ariaLabel: string` → obbligatoria se `interactive`.
- `dataset: {…}` → attributi `data-*` per hook di click delegato dal chiamante.

## Slot / composizione

- `Card.footer` è HTML string: il chiamante compone (es. `Button({...})`).
- `HeroCard.action`, `WorkoutCard.action`, `RecordCard.action`, `EmptyCard.action` sono alias di `footer`.
- Nessuna card importa da `Buttons/`. Le CTA sono passate dall'esterno.

## Esempi

```js
import { HeroCard } from './Cards/HeroCard.js';
import { StatisticCard } from './Cards/StatisticCard.js';
import { GoalCard } from './Cards/GoalCard.js';
import { HistoryCard } from './Cards/HistoryCard.js';
import { Button } from './Buttons/Button.js';

root.innerHTML =
  HeroCard({
    title:  'Push A · Settimana 3',
    body:   '4 sessioni · 12 340 kg volume',
    action: Button({ variant: 'ghost', size: 'sm', label: 'Continua', icon: 'play' })
  }) +
  StatisticCard({ eyebrow: 'Volume', value: '15 200', unit: 'kg', delta: '+ 12 %' }) +
  GoalCard({ progress: 72, hint: '72 % · 3 sessioni al goal' }) +
  HistoryCard({ initials: 'PB', title: 'Pull B · Giorno 5', meta: 'Ieri · 38 min', badge: 'Completata' });
```

## Stati

| Stato | Come si attiva |
|-------|----------------|
| Default     | — |
| Hover       | `.is-interactive:hover` |
| Pressed     | `.is-interactive:active` |
| Focus       | `:focus-visible` |
| Disabled    | (non applicabile: le card non hanno disabled — il chiamante nasconde la CTA interna) |
| Loading     | `LoadingCard` con `aria-busy` |
| Empty       | `EmptyCard` |
| Success     | `HistoryCard({ badgeVariant: 'success' })` |
| Error       | `HistoryCard({ badgeVariant: 'error' })` |

## Regole

- Nessun listener registrato nella card. Il chiamante attacca `click` sul root (usando `dataset` per identificare) o via delegate.
- Solo Design Tokens nel CSS.
- Le icone provengono da `Shared/Icon.js` (usate solo da `EmptyCard`, `ExerciseCard`).
- L'unica dipendenza cross-categoria è `Shared/`.
