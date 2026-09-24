import test from 'node:test';
import assert from 'node:assert/strict';
import { catalog } from '../src/catalog.js';
import { assertState, initialState } from '../src/domain.js';
import { draftFromLatest, publishUnitDraft } from '../native/authoring.js';
import {
  deleteImprovementProposal, derivativeDraftFrom, makeImprovementProposal,
  saveImprovementProposal, sourceReference,
} from '../native/lineage.js';

const source=catalog[0];
const original=value=>value[source.sourceLocale] ?? Object.values(value)[0];
const derivativeInput=()=>({
  title:`${original(source.title)} — alternative`,description:original(source.description),
  place:original(source.place),tip:original(source.tip),points:source.points.map(point=>original(point.text)),
});
const pointIds=()=>source.points.map((_,index)=>`derived-point-${index+1}`);

test('improvement proposal is private local-only and references the exact source version',()=>{
  const proposal=makeImprovementProposal(source,'  Clarify the best visiting time.  ','improvement-one');
  const state=saveImprovementProposal(initialState(),proposal);
  assert.equal(state.improvementProposals[0].visibility,'private');
  assert.equal(state.improvementProposals[0].status,'local_only');
  assert.equal(state.improvementProposals[0].suggestion,'Clarify the best visiting time.');
  assert.deepEqual(state.improvementProposals[0].source,sourceReference(source));
  assert.equal(state.localUnits.length,0);
});

test('improvement proposal rejects blank, oversized and duplicate local saves',()=>{
  assert.throws(()=>makeImprovementProposal(source,'   ','improvement-one'),/invalidImprovement/);
  assert.throws(()=>makeImprovementProposal(source,'x'.repeat(1001),'improvement-one'),/invalidImprovement/);
  const proposal=makeImprovementProposal(source,'Use a clearer landmark.','improvement-one');
  const state=saveImprovementProposal(initialState(),proposal);
  assert.throws(()=>saveImprovementProposal(state,proposal),/invalidImprovement/);
});

test('deleting an improvement removes only that local proposal',()=>{
  const proposal=makeImprovementProposal(source,'Update the manual estimate.','improvement-one');
  const state=saveImprovementProposal(initialState(),proposal);
  const next=deleteImprovementProposal(state,proposal.id);
  assert.deepEqual(next.improvementProposals,[]);
  assert.equal(state.improvementProposals.length,1);
  assert.throws(()=>deleteImprovementProposal(next,proposal.id),/invalidImprovement/);
});

test('derivative receives a new unit identity and exact original/version attribution',()=>{
  const draft=derivativeDraftFrom(source,derivativeInput(),{draftId:'derivative-draft',pointIds:pointIds()});
  const state=publishUnitDraft(initialState(),draft,{newUnitId:'derived-unit',versionId:'derived-v1'});
  const version=state.localUnits[0].versions[0];
  assert.equal(version.id,'derived-unit'); assert.notEqual(version.id,source.id);
  assert.deepEqual(version.derivedFrom,sourceReference(source));
  assert.deepEqual(version.points.map(point=>point.id),pointIds());
  assert(!version.points.some(point=>source.points.some(originalPoint=>originalPoint.id===point.id)));
});

test('derivative source attribution remains immutable across later versions',()=>{
  const draft=derivativeDraftFrom(source,derivativeInput(),{draftId:'derivative-draft',pointIds:pointIds()});
  let state=publishUnitDraft(initialState(),draft,{newUnitId:'derived-unit',versionId:'derived-v1'});
  const next=draftFromLatest(state,'derived-unit','derivative-v2-draft');
  next.title='Revised derivative';
  state=publishUnitDraft(state,next,{versionId:'derived-v2'});
  assert.deepEqual(state.localUnits[0].versions[0].derivedFrom,sourceReference(source));
  assert.deepEqual(state.localUnits[0].versions[1].derivedFrom,sourceReference(source));
});

test('state rejects changed or missing lineage within one derivative history',()=>{
  const draft=derivativeDraftFrom(source,derivativeInput(),{draftId:'derivative-draft',pointIds:pointIds()});
  let state=publishUnitDraft(initialState(),draft,{newUnitId:'derived-unit',versionId:'derived-v1'});
  const next=draftFromLatest(state,'derived-unit','derivative-v2-draft');
  state=publishUnitDraft(state,next,{versionId:'derived-v2'});
  const broken=structuredClone(state);
  broken.localUnits[0].versions[1].derivedFrom=null;
  assert.throws(()=>assertState(broken),/loadError/);
});

test('derivative point mapping must be complete and translation does not create lineage',()=>{
  assert.throws(()=>derivativeDraftFrom(source,derivativeInput(),{draftId:'bad-draft',pointIds:[]}),/invalidLineage/);
  assert.equal(source.derivedFrom,undefined);
  assert.equal(sourceReference(source).unitId,source.id);
});
