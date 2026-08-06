# Foundation

Layer di base della libreria UI. **Non** contiene componenti: solo la materia prima consumata da tutte le altre categorie.

## File

| File | Contenuto |
|------|-----------|
| `tokens.css` | Variabili CSS derivate da `DOCS/13_DESIGN_TOKENS.json` v1.1.0. Include i 3 temi (`light`, `dark`, `amoled`) e la regola `prefers-reduced-motion`. |
| `typography.css` | Classi utility `.t-*` per applicare direttamente uno scalino di tipo (es. `.t-h2`, `.t-caption`, `.t-numeric`). |
| `utilities.css` | Layout primitives strutturali (`.c-stack`, `.c-row`, `.c-grow`, `.c-sr-only`, `.c-surface`) e reset locale `box-sizing`. |

## Regola d'oro

**Nessun altro file CSS della libreria è autorizzato a definire valori grafici letterali.** Ogni colore, dimensione, radius, ombra, durata, curva deve essere `var(--token)`.

Le uniche eccezioni ammesse:

1. Strutture di layout (grid-template, flex-direction) — non hanno un token.
2. Percentuali intrinseche (`width: 100%`, `opacity: 1`) — costanti universali.
3. Il file `tokens.css` stesso, che è il ponte JSON → CSS.

## Aggiungere un tema

Il tema è dichiarato in `DOCS/13_DESIGN_TOKENS.json → $themeExtensions.<name>` con `extends` + `overrides`. Poi in `tokens.css` si aggiunge il blocco `[data-theme="<name>"]` con l'unione risultante.

L'app usa il tema via `document.documentElement.dataset.theme = 'dark'`.

## Cosa NON fare

- ❌ Aggiungere `--color-*` inline in un file componente.
- ❌ Cambiare un valore in `tokens.css` senza aggiornare prima il JSON.
- ❌ Usare `hsl(...)` / `#hex` letterali fuori da `tokens.css`.
