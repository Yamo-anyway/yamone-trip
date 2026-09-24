import test from 'node:test';
import assert from 'node:assert/strict';
import { addItem, assertState, createTrip, initialState } from '../src/domain.js';
import { deleteUnitDraft, draftFromLatest, makeUnitDraft, publishUnitDraft, saveUnitDraft } from '../native/authoring.js';

const region={country:'KR',city:'seoul',district:'seongsu'};
const input=(points=[{id:'point-one',text:'Notice one detail'}])=>({
  sourceLocale:'en',region,category:'walk',durationMinutes:'30',costAmount:'0',currency:'krw',
  title:'A local walk',description:'A private local unit draft.',place:'A manually selected area',tip:'Check local rules.',points,
});
const draft=(overrides={})=>makeUnitDraft({...input(),...overrides},{draftId:'draft-one'});

test('local unit draft is private, validated and saved without a public claim',()=>{
  const made=draft(); const state=saveUnitDraft(initialState(),made);
  assert.equal(state.unitDrafts[0].visibility,'private'); assert.equal(state.localUnits.length,0);
  assert.equal(state.unitDrafts[0].cost.currency,'KRW'); assertState(state);
});

test('authoring requires 1–5 unique stable point ids and valid original locale',()=>{
  for(const points of [[],Array.from({length:6},(_,i)=>({id:`p-${i}`,text:'Point'})),[{id:'same',text:'One'},{id:'same',text:'Two'}]]) {
    assert.throws(()=>makeUnitDraft(input(points),{draftId:'draft'}),/invalidUnitDraft/);
  }
  assert.throws(()=>draft({sourceLocale:'English'}),/invalidUnitDraft/);
});

test('saving a first immutable local version removes its draft',()=>{
  const made=draft(); const state=publishUnitDraft(initialState(),made,{newUnitId:'unit-local',versionId:'unit-local-v1'});
  const version=state.localUnits[0].versions[0];
  assert.equal(state.unitDrafts.length,0); assert.equal(state.localUnits[0].visibility,'private');
  assert.equal(version.version,1); assert.equal(version.sourceType,'user_authored'); assert.equal(version.sourceLocale,'en');
  assert.deepEqual(version.title,{en:'A local walk'}); assert.equal(version.points[0].id,'point-one');
});

test('new-version draft preserves source locale and stable point identities',()=>{
  let state=publishUnitDraft(initialState(),draft(),{newUnitId:'unit-local',versionId:'unit-local-v1'});
  const next=draftFromLatest(state,'unit-local','draft-v2');
  assert.equal(next.baseVersionId,'unit-local-v1'); assert.equal(next.sourceLocale,'en');
  assert.deepEqual(next.points.map(point=>point.id),['point-one']);
  next.title='A revised local walk'; next.points[0].text='Notice a revised detail';
  state=publishUnitDraft(state,next,{versionId:'unit-local-v2'});
  assert.equal(state.localUnits[0].versions.length,2);
  assert.equal(state.localUnits[0].versions[0].title.en,'A local walk');
  assert.equal(state.localUnits[0].versions[1].title.en,'A revised local walk');
  assert.equal(state.localUnits[0].versions[1].points[0].id,'point-one');
});

test('publishing a new version never changes an existing trip snapshot',()=>{
  let state=publishUnitDraft(initialState(),draft(),{newUnitId:'unit-local',versionId:'unit-local-v1'});
  const v1=state.localUnits[0].versions[0];
  let trip=createTrip({name:'Snapshot test',startDate:'2026-10-01',endDate:'2026-10-01',region},'trip-local');
  trip=addItem(trip,v1,{date:'2026-10-01',startTime:'09:00'},'item-local');
  state=assertState({...state,trips:[trip]});
  const before=structuredClone(state.trips[0].items[0].snapshot);
  const next=draftFromLatest(state,'unit-local','draft-v2'); next.title='Changed source version';
  state=publishUnitDraft(state,next,{versionId:'unit-local-v2'});
  assert.deepEqual(state.trips[0].items[0].snapshot,before);
  assert.equal(state.trips[0].items[0].unitVersionId,'unit-local-v1');
});

test('source locale is immutable across versions and stale bases fail closed',()=>{
  let state=publishUnitDraft(initialState(),draft(),{newUnitId:'unit-local',versionId:'unit-local-v1'});
  const stale=draftFromLatest(state,'unit-local','stale-draft');
  const changed={...stale,sourceLocale:'ko'};
  assert.throws(()=>saveUnitDraft(state,changed),/loadError/);
  const next={...stale,id:'next-draft'};
  state=publishUnitDraft(state,next,{versionId:'unit-local-v2'});
  assert.throws(()=>saveUnitDraft(state,stale),/loadError/);
});

test('only one open next-version draft is allowed for a local unit',()=>{
  let state=publishUnitDraft(initialState(),draft(),{newUnitId:'unit-local',versionId:'unit-local-v1'});
  const next=draftFromLatest(state,'unit-local','draft-v2'); state=saveUnitDraft(state,next);
  assert.throws(()=>draftFromLatest(state,'unit-local','another-draft'),/invalidUnitDraft/);
});
test('deleting a saved draft does not delete immutable local versions',()=>{
  let state=publishUnitDraft(initialState(),draft(),{newUnitId:'unit-local',versionId:'unit-local-v1'});
  state=saveUnitDraft(state,draftFromLatest(state,'unit-local','draft-v2'));
  state=deleteUnitDraft(state,'draft-v2');
  assert.equal(state.unitDrafts.length,0); assert.equal(state.localUnits[0].versions.length,1);
  assert.throws(()=>deleteUnitDraft(state,'missing'),/invalidUnitDraft/);
});
