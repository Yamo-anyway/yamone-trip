import test from 'node:test';
import assert from 'node:assert/strict';
import { catalog } from '../src/catalog.js';
import { addItem, createRecord, createTrip, initialState } from '../src/domain.js';
import { BACKUP_FORMAT, MAX_BACKUP_BYTES, canonicalState, createBackup, parseBackup } from '../native/backup.js';
import { draftFromLatest, makeUnitDraft, publishUnitDraft, saveUnitDraft } from '../native/authoring.js';
import { derivativeDraftFrom, makeImprovementProposal, saveImprovementProposal } from '../native/lineage.js';

function populatedState() {
  let trip = createTrip({
    name:'Synthetic private trip', startDate:'2026-10-01', endDate:'2026-10-02', region:catalog[0].region,
  }, 'backup-trip');
  trip = addItem(trip, catalog[0], {date:'2026-10-01', startTime:'09:00'}, 'backup-item');
  trip.items[0].movementMinutes = 12;
  trip.items[0].breakMinutes = 7;
  const record = createRecord(trip.items[0], [trip.items[0].snapshot.points[0].id], 'Synthetic private note');
  return {...initialState(), preference:'en', trips:[trip], records:{'backup-item':record}};
}

const options = {createdAt:'2026-09-24T15:30:00.000Z', appVersion:'0.5.0'};

test('native backup round trip preserves private trips, exact snapshots and notes', () => {
  const state = populatedState();
  const parsed = parseBackup(createBackup(state, options));
  assert.deepEqual(parsed.state, canonicalState(state));
  assert.equal(parsed.state.trips[0].items[0].unitVersionId, catalog[0].versionId);
  assert.equal(parsed.state.records['backup-item'].note, 'Synthetic private note');
  assert.deepEqual(parsed.preview, {source:'backup_v1', ...options, preference:'en', tripCount:1, itemCount:1, recordCount:1, localUnitCount:0, draftCount:0, improvementCount:0});
});

test('backup envelope is versioned and contains no account, sync or publication claim', () => {
  const value = JSON.parse(createBackup(initialState(), options));
  assert.equal(value.format, BACKUP_FORMAT); assert.equal(value.formatVersion, 1);
  assert.deepEqual(Object.keys(value).sort(), ['appVersion','createdAt','format','formatVersion','state']);
});

test('legacy raw schema-v1 import is explicit and gets a privacy-safe preview', () => {
  const current = populatedState();
  const {localUnits,unitDrafts,...state}=current; state.schemaVersion=1;
  const parsed = parseBackup(JSON.stringify(state));
  assert.equal(parsed.preview.source, 'legacy_raw_v1');
  assert.equal(parsed.preview.createdAt, null);
  assert.equal(parsed.preview.recordCount, 1);
  assert(!('note' in parsed.preview)); assert.deepEqual(parsed.state, canonicalState(state));
  assert.equal(parsed.state.schemaVersion,3); assert.deepEqual(parsed.state.localUnits,[]); assert.deepEqual(parsed.state.improvementProposals,[]);
});

test('raw schema-v2 import adds empty improvement storage without changing the source object',()=>{
  const current=initialState();
  const {improvementProposals,...legacy}=current; legacy.schemaVersion=2;
  const parsed=parseBackup(JSON.stringify(legacy));
  assert.equal(parsed.preview.source,'raw_state_v2');
  assert.equal(parsed.state.schemaVersion,3);
  assert.deepEqual(parsed.state.improvementProposals,[]);
  assert.equal(legacy.schemaVersion,2);
});

test('canonical import drops unknown envelope and nested fields before persistence', () => {
  const state = populatedState();
  state.futureSecret = 'drop'; state.trips[0].futureField = 'drop';
  state.trips[0].items[0].snapshot.futureField = 'drop'; state.records['backup-item'].futureField = 'drop';
  const parsed = parseBackup(JSON.stringify(state)).state;
  assert.equal(parsed.futureSecret, undefined); assert.equal(parsed.trips[0].futureField, undefined);
  assert.equal(parsed.trips[0].items[0].snapshot.futureField, undefined);
  assert.equal(parsed.records['backup-item'].futureField, undefined);
});

test('invalid JSON and internally inconsistent snapshots are rejected', () => {
  assert.throws(() => parseBackup('{broken'), /backupInvalid/);
  const envelope = JSON.parse(createBackup(populatedState(), options));
  envelope.state.trips[0].items[0].unitVersionId = 'wrong-version';
  assert.throws(() => parseBackup(JSON.stringify(envelope)), /backupInvalid/);
});

test('unsupported old or future backup versions are rejected without a candidate state', () => {
  for (const formatVersion of [0, 2]) {
    const envelope = JSON.parse(createBackup(initialState(), options)); envelope.formatVersion = formatVersion;
    assert.throws(() => parseBackup(JSON.stringify(envelope)), /backupVersion/);
  }
  assert.throws(() => parseBackup(JSON.stringify({schemaVersion:999,trips:[]})), /backupVersion/);
});

test('oversized or blank imports fail before JSON parsing', () => {
  assert.throws(() => parseBackup(''), /backupTooLarge/);
  assert.throws(() => parseBackup(' '.repeat(MAX_BACKUP_BYTES + 1)), /backupTooLarge/);
  assert.throws(() => parseBackup('가'.repeat(Math.ceil(MAX_BACKUP_BYTES / 3) + 1)), /backupTooLarge/);
});

test('backup metadata must use a canonical instant and semantic app version', () => {
  for (const bad of [
    {...options, createdAt:'2026-09-24'}, {...options, createdAt:'not-a-date'}, {...options, appVersion:'latest'},
  ]) assert.throws(() => createBackup(initialState(), bad), /backupError/);
});

test('backup round trip preserves local immutable versions and private authoring drafts',()=>{
  const input={sourceLocale:'ko',region:catalog[0].region,category:'walk',durationMinutes:'20',costAmount:'0',currency:'KRW',title:'로컬 원문',description:'로컬 설명',place:'직접 선택한 장소',tip:'개인 확인',points:[{id:'stable-point',text:'직접 확인하기'}]};
  const first=makeUnitDraft(input,{draftId:'author-draft'});
  let state=publishUnitDraft(initialState(),first,{newUnitId:'author-unit',versionId:'author-v1'});
  state=saveUnitDraft(state,draftFromLatest(state,'author-unit','author-v2-draft'));
  const parsed=parseBackup(createBackup(state,options));
  assert.deepEqual(parsed.state,state); assert.equal(parsed.preview.localUnitCount,1); assert.equal(parsed.preview.draftCount,1);
});

test('backup round trip preserves attributed derivatives and private improvements',()=>{
  const source=catalog[0], locale=source.sourceLocale;
  const original=value=>value[locale] ?? Object.values(value)[0];
  const derivative=derivativeDraftFrom(source,{
    title:`${original(source.title)} derivative`,description:original(source.description),place:original(source.place),
    tip:original(source.tip),points:source.points.map(point=>original(point.text)),
  },{draftId:'derived-draft',pointIds:source.points.map((_,index)=>`backup-derived-point-${index}`)});
  let state=publishUnitDraft(initialState(),derivative,{newUnitId:'backup-derived-unit',versionId:'backup-derived-v1'});
  state=saveImprovementProposal(state,makeImprovementProposal(source,'Clarify this demo detail.','backup-improvement'));
  const envelope=JSON.parse(createBackup(state,options));
  envelope.state.localUnits[0].versions[0].derivedFrom.injected='drop-me';
  envelope.state.improvementProposals[0].source.injected='drop-me';
  const parsed=parseBackup(JSON.stringify(envelope));
  assert.deepEqual(parsed.state,state);
  assert.equal(parsed.preview.improvementCount,1);
  assert.equal(parsed.state.localUnits[0].versions[0].derivedFrom.versionId,source.versionId);
  assert(!('injected' in parsed.state.localUnits[0].versions[0].derivedFrom));
  assert(!('injected' in parsed.state.improvementProposals[0].source));
});
