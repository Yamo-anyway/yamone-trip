export const BACK_ACTION = Object.freeze({
  dismissDiscard: 'dismiss-discard',
  confirmDiscard: 'confirm-discard',
  closeEditor: 'close-editor',
  closeUnit: 'close-unit',
  closeTrip: 'close-trip',
  openDiscover: 'open-discover',
  exitApp: 'exit-app',
});

export function resolveBackAction({
  discardPrompt = false,
  editorOpen = false,
  editorDirty = false,
  unitOpen = false,
  page = 'discover',
  tripOpen = false,
} = {}) {
  if (discardPrompt) return BACK_ACTION.dismissDiscard;
  if (editorOpen && editorDirty) return BACK_ACTION.confirmDiscard;
  if (editorOpen) return BACK_ACTION.closeEditor;
  if (unitOpen) return BACK_ACTION.closeUnit;
  if (page === 'trips' && tripOpen) return BACK_ACTION.closeTrip;
  if (page !== 'discover') return BACK_ACTION.openDiscover;
  return BACK_ACTION.exitApp;
}
