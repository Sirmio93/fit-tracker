/* ==========================================================================
   components/bootstrap.js — bridge tra libreria ES modules e app.js legacy.
   Espone il namespace UI su `window.UI` così che il monolita `app.js`
   (caricato con `defer`, non-module) possa consumare i componenti dopo
   la migrazione progressiva senza dover essere convertito in modulo.

   Fase 10 Step 1 — Component Infrastructure.
   - NON modifica business logic.
   - NON monta nulla nel DOM.
   - Side-effect: assegnazione a `window.UI`. Nient'altro.

   Ordine di esecuzione atteso:
     1. HTML parsing
     2. Module scripts (questo file) + defer scripts (app.js) — entrambi
        eseguiti dopo il parsing. `window.UI` è disponibile prima che
        qualsiasi handler `click/DOMContentLoaded` in app.js scatti.
   ========================================================================== */

import * as UI from './index.js';

if (typeof window !== 'undefined') {
  window.UI = Object.freeze({ ...UI });
}
