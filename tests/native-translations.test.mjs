import test from 'node:test';
import assert from 'node:assert/strict';
import { catalog } from '../src/catalog.js';
import { assertState, initialState, validateTranslationVariant } from '../src/domain.js';
import {
  deleteTranslationVariant, makeTranslationVariant, saveTranslationVariant,
  translationDraft, translationFor,
} from '../native/translations.js';

const source=catalog[0];
const englishInput=()=>({
  title:'A careful translated title',
  description:'A careful translated description.',
  place:'A translated place guide',
  tip:'A translated tip',
  points:source.points.map((point,index)=>({id:point.id,text:`Translated experience point ${index+1}`})),
});

test('manual translation keeps exact unit, version and point identities',()=>{
  const variant=makeTranslationVariant(source,englishInput(),{locale:'en'});
  assert.equal(variant.unitId,source.id);
  assert.equal(variant.versionId,source.versionId);
  assert.equal(variant.sourceLocale,source.sourceLocale);
  assert.equal(variant.method,'manual');
  assert.equal(variant.reviewStatus,'draft');
  assert.deepEqual(variant.points.map(point=>point.id),source.points.map(point=>point.id));
  assert.equal(variant.derivedFrom,undefined);
});

test('translation draft uses an embedded fixture only as editable initial text',()=>{
  const draft=translationDraft(source,'en');
  assert.equal(draft.title,source.title.en);
  assert.deepEqual(draft.points.map(point=>point.id),source.points.map(point=>point.id));
  assert.deepEqual(source.title,{ko:'서울숲 느긋한 산책',en:'A gentle walk in Seoul Forest'});
});

test('saving and reviewing upserts one exact translation variant',()=>{
  const draft=makeTranslationVariant(source,englishInput(),{locale:'en'});
  let state=saveTranslationVariant(initialState(),source,draft);
  const reviewed=makeTranslationVariant(source,{...englishInput(),title:'Reviewed title'},{locale:'en',reviewStatus:'user_reviewed'});
  state=saveTranslationVariant(state,source,reviewed);
  assert.equal(state.translationVariants.length,1);
  assert.equal(translationFor(state,source,'en').title,'Reviewed title');
  assert.equal(translationFor(state,source,'en').reviewStatus,'user_reviewed');
  assert.equal(source.title.ko,'서울숲 느긋한 산책');
});

test('translations are bound to one immutable source version',()=>{
  const state=saveTranslationVariant(initialState(),source,makeTranslationVariant(source,englishInput(),{locale:'en'}));
  const nextVersion={...source,versionId:'forest-walk-v2',version:2};
  assert.equal(translationFor(state,nextVersion,'en'),null);
  assert.equal(translationFor(state,source,'ko'),null);
});

test('invalid locale and changed point identity are rejected',()=>{
  assert.throws(()=>translationDraft(source,'ko'),/invalidTranslation/);
  assert.throws(()=>makeTranslationVariant(source,englishInput(),{locale:'fr'}),/invalidTranslation/);
  const missing={...englishInput(),points:englishInput().points.slice(1)};
  assert.throws(()=>makeTranslationVariant(source,missing,{locale:'en'}),/invalidTranslation/);
  const reordered={...englishInput(),points:englishInput().points.reverse()};
  assert.throws(()=>makeTranslationVariant(source,reordered,{locale:'en'}),/invalidTranslation/);
});

test('machine and manual review states are distinguishable and constrained',()=>{
  const machine=makeTranslationVariant(source,englishInput(),{locale:'en',method:'machine',reviewStatus:'machine_unreviewed'});
  assert.equal(validateTranslationVariant(machine),machine);
  assert.throws(()=>makeTranslationVariant(source,englishInput(),{locale:'en',method:'machine',reviewStatus:'draft'}),/invalidTranslation/);
  assert.throws(()=>makeTranslationVariant(source,englishInput(),{locale:'en',method:'manual',reviewStatus:'machine_unreviewed'}),/invalidTranslation/);
});

test('deleting a translation preserves source and unrelated state',()=>{
  const variant=makeTranslationVariant(source,englishInput(),{locale:'en'});
  const state=saveTranslationVariant({...initialState(),preference:'ko'},source,variant);
  const next=deleteTranslationVariant(state,source.id,source.versionId,'en');
  assert.deepEqual(next.translationVariants,[]);
  assert.equal(next.preference,'ko');
  assert.equal(state.translationVariants.length,1);
  assert.throws(()=>deleteTranslationVariant(next,source.id,source.versionId,'en'),/invalidTranslation/);
});

test('state rejects duplicate translation identities',()=>{
  const variant=makeTranslationVariant(source,englishInput(),{locale:'en'});
  const state={...initialState(),translationVariants:[variant,structuredClone(variant)]};
  assert.throws(()=>assertState(state),/loadError/);
});
