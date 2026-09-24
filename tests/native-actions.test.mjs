import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState } from '../src/domain.js';
import { catalog } from '../src/catalog.js';
import { addUnitToTrip, createPrivateTrip, editTripItem, findTripItem, saveExperienceRecord } from '../native/actions.js';
import { createIdGenerator } from '../native/ids.js';
import { beginDraft, changeDraft, hasUnsavedChanges } from '../native/drafts.js';

const region = {country:'KR', city:'seoul', district:'seongsu'};
const tripInput = {name:'Synthetic private trip', startDate:'2026-10-01', endDate:'2026-10-02', region};

test('native IDs require safe prefixes and avoid an existing ID without crypto globals', () => {
  const ids = createIdGenerator({now:() => 1234, random:() => 0});
  const first = ids.next('trip');
  const second = ids.next('trip', [first]);
  assert.match(first, /^[A-Za-z0-9_-]{1,128}$/);
  assert.notEqual(first, second);
  assert.throws(() => ids.next('../bad'), /invalid/);
});

test('native draft guard detects a changed field and allows an exact revert', () => {
  const original = beginDraft('record', {checkedIds:['one'], note:'private'}, {itemId:'item'});
  assert.equal(hasUnsavedChanges(original), false);
  const changed = changeDraft(original, 'note', 'edited');
  assert.equal(hasUnsavedChanges(changed), true);
  assert.equal(hasUnsavedChanges(changeDraft(changed, 'note', 'private')), false);
  assert.deepEqual(original.draft, {checkedIds:['one'], note:'private'});
});

test('native draft copies nested input before tracking discard protection', () => {
  const input = {checkedIds:['one'], note:''};
  const editor = beginDraft('record', input);
  input.checkedIds.push('two');
  assert.deepEqual(editor.draft.checkedIds, ['one']);
  assert.equal(hasUnsavedChanges(editor), false);
});

test('native action flow creates a private trip and immutable scheduled snapshot', () => {
  const before = initialState();
  const withTrip = createPrivateTrip(before, tripInput, 'trip-native');
  const scheduled = addUnitToTrip(withTrip, 'trip-native', catalog[0], {date:'2026-10-01', startTime:'09:00'}, 'item-native');
  assert.equal(before.trips.length, 0);
  assert.equal(scheduled.trips[0].visibility, 'private');
  assert.notEqual(scheduled.trips[0].items[0].snapshot, catalog[0]);
  const originalTitle = scheduled.trips[0].items[0].snapshot.title.ko;
  catalog[0].title.ko = 'temporary mutation';
  assert.equal(scheduled.trips[0].items[0].snapshot.title.ko, originalTitle);
  catalog[0].title.ko = originalTitle;
});

test('native scheduling rejects duplicate item identity and out-of-trip dates', () => {
  const withTrip = createPrivateTrip(initialState(), tripInput, 'trip-native');
  const scheduled = addUnitToTrip(withTrip, 'trip-native', catalog[0], {date:'2026-10-01', startTime:'09:00'}, 'item-native');
  assert.throws(() => addUnitToTrip(scheduled, 'trip-native', catalog[1], {date:'2026-10-01', startTime:'11:00'}, 'item-native'), /invalidSchedule/);
  assert.throws(() => addUnitToTrip(withTrip, 'trip-native', catalog[0], {date:'2026-10-03', startTime:'09:00'}, 'new-item'), /invalidSchedule/);
});

test('native schedule edit preserves identity and version snapshot', () => {
  let state = createPrivateTrip(initialState(), tripInput, 'trip-native');
  state = addUnitToTrip(state, 'trip-native', catalog[0], {date:'2026-10-01', startTime:'09:00'}, 'item-native');
  const before = JSON.parse(JSON.stringify(state.trips[0].items[0]));
  state = editTripItem(state, 'trip-native', 'item-native', {date:'2026-10-02', startTime:'10:00', durationMinutes:45, movementMinutes:15, breakMinutes:10});
  const after = state.trips[0].items[0];
  assert.equal(after.id, before.id); assert.equal(after.unitVersionId, before.unitVersionId);
  assert.deepEqual(after.snapshot, before.snapshot); assert.equal(after.movementMinutes, 15);
});

test('native record stores self-reported points and private note without changing snapshot', () => {
  let state = createPrivateTrip(initialState(), tripInput, 'trip-native');
  state = addUnitToTrip(state, 'trip-native', catalog[0], {date:'2026-10-01', startTime:'09:00'}, 'item-native');
  const snapshot = JSON.parse(JSON.stringify(state.trips[0].items[0].snapshot));
  const point = snapshot.points[0].id;
  state = saveExperienceRecord(state, 'trip-native', 'item-native', [point], 'Synthetic private note');
  const found = findTripItem(state, 'trip-native', 'item-native');
  assert.equal(found.record.status, 'partial');
  assert.equal(found.record.verification, 'self_reported');
  assert.equal(found.record.note, 'Synthetic private note');
  assert.deepEqual(found.item.snapshot, snapshot);
});

test('native skipped record cannot also contain checked points', () => {
  let state = createPrivateTrip(initialState(), tripInput, 'trip-native');
  state = addUnitToTrip(state, 'trip-native', catalog[0], {date:'2026-10-01', startTime:'09:00'}, 'item-native');
  const point = state.trips[0].items[0].snapshot.points[0].id;
  assert.throws(() => saveExperienceRecord(state, 'trip-native', 'item-native', [point], '', true), /invalid/);
  const skipped = saveExperienceRecord(state, 'trip-native', 'item-native', [], 'Not attempted', true);
  assert.equal(skipped.records['item-native'].status, 'skipped');
});

test('native actions reject missing trips or items without mutating state', () => {
  const state = initialState(), raw = JSON.stringify(state);
  assert.throws(() => addUnitToTrip(state, 'missing', catalog[0], {date:'2026-10-01',startTime:'09:00'}, 'item'), /invalidTrip/);
  assert.throws(() => saveExperienceRecord(state, 'missing', 'item', [], ''), /invalidTrip/);
  assert.equal(JSON.stringify(state), raw);
});
