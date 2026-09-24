const fingerprint = value => JSON.stringify(value);

export function beginDraft(kind, draft, context = {}) {
  const copy = JSON.parse(JSON.stringify(draft));
  return {kind, draft:copy, initial:fingerprint(copy), context};
}

export function changeDraft(editor, key, value) {
  return {...editor, draft:{...editor.draft, [key]:value}};
}

export function hasUnsavedChanges(editor) {
  return !!editor && fingerprint(editor.draft) !== editor.initial;
}
