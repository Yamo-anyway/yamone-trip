import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { BACK_ACTION, resolveBackAction } from '../native/navigation.js';
import { nativeCopy } from '../native/copy.js';

test('native back resolution never discards a changed editor directly', () => {
  assert.equal(resolveBackAction({editorOpen:true, editorDirty:true}), BACK_ACTION.confirmDiscard);
  assert.equal(resolveBackAction({discardPrompt:true, editorOpen:true, editorDirty:true}), BACK_ACTION.dismissDiscard);
  assert.equal(resolveBackAction({editorOpen:true, editorDirty:false}), BACK_ACTION.closeEditor);
});

test('native back resolution closes the deepest view before app exit', () => {
  assert.equal(resolveBackAction({unitOpen:true, page:'settings'}), BACK_ACTION.closeUnit);
  assert.equal(resolveBackAction({page:'trips', tripOpen:true}), BACK_ACTION.closeTrip);
  assert.equal(resolveBackAction({page:'settings'}), BACK_ACTION.openDiscover);
  assert.equal(resolveBackAction(), BACK_ACTION.exitApp);
});

test('Korean and English accessibility hints have matching non-empty keys', () => {
  for (const key of ['navigationHint','checklistHint']) {
    assert.equal(typeof nativeCopy.ko[key], 'string');
    assert.equal(typeof nativeCopy.en[key], 'string');
    assert(nativeCopy.ko[key].trim()); assert(nativeCopy.en[key].trim());
  }
});

test('native source keeps scalable text, semantic controls and flexible two-row navigation', async () => {
  const source=await readFile('native/App.js','utf8');
  assert(!source.includes('allowFontScaling={false}'));
  for (const marker of ['allowFontScaling={true}', 'role="checkbox"', 'role="radio"', 'role="tab"',
    'accessibilityRole="tablist"', 'accessibilityHint={n.checklistHint}', 'minHeight:48', "flexBasis:'40%'"]) {
    assert(source.includes(marker), marker);
  }
});
