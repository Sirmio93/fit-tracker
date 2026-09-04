/* ==========================================================================
   CreateWorkout/BlockActions.js — T1.8 · Menu contestuale per blocco.

   Rende il pannello azioni di un blocco quando ui.blockMenuId === block.id.
   Le voci sono button data-action wired nel delegator di app.js:
     · create-block-move-up    → sposta blocco in su
     · create-block-move-down  → sposta blocco in giù
     · create-block-duplicate  → copia blocco sotto quello corrente
     · create-block-delete     → elimina con openConfirmDialog (tone: danger)

   Sposta su è disabilitato per il primo blocco; sposta giù per l'ultimo.

   API: renderBlockMenu(block, ui, blockIndex, totalBlocks) → HTML string
   (stringa vuota se ui.blockMenuId !== block.id).
   ========================================================================== */

import { esc } from '../Shared/helpers.js';

export function renderBlockMenu(block, ui, blockIndex, totalBlocks) {
  if (!block || !ui || ui.blockMenuId !== block.id) return '';

  var id       = block.id;
  var isFirst  = blockIndex === 0;
  var isLast   = blockIndex === totalBlocks - 1;
  var upAttrs  = isFirst  ? ' disabled aria-disabled="true"' : '';
  var dnAttrs  = isLast   ? ' disabled aria-disabled="true"' : '';

  return (
    '<div class="cw-block-menu" role="menu" aria-label="Opzioni blocco">' +
      '<button role="menuitem" class="cw-block-menu__item"' +
        ' data-action="create-block-move-up" data-block-id="' + esc(id) + '"' + upAttrs + '>' +
        '↑ Sposta su' +
      '</button>' +
      '<button role="menuitem" class="cw-block-menu__item"' +
        ' data-action="create-block-move-down" data-block-id="' + esc(id) + '"' + dnAttrs + '>' +
        '↓ Sposta giù' +
      '</button>' +
      '<hr class="cw-block-menu__sep" role="separator">' +
      '<button role="menuitem" class="cw-block-menu__item"' +
        ' data-action="create-block-duplicate" data-block-id="' + esc(id) + '">' +
        'Duplica' +
      '</button>' +
      '<button role="menuitem" class="cw-block-menu__item cw-block-menu__item--danger"' +
        ' data-action="create-block-delete" data-block-id="' + esc(id) + '">' +
        'Elimina' +
      '</button>' +
    '</div>'
  );
}
