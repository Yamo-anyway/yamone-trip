import { assertState, validateUnit, validateUnitDraft } from '../src/domain.js';

const copy = value => JSON.parse(JSON.stringify(value));
const whole = value => typeof value==='number' ? value : /^\d+$/.test(value) ? Number(value) : Number.NaN;
const amount = value => typeof value==='number' ? value : /^\d+(?:\.\d{1,2})?$/.test(value) ? Number(value) : Number.NaN;

export function makeUnitDraft(input, {draftId, unitId = null, baseVersionId = null}) {
  const draft={
    id:draftId, unitId, baseVersionId, visibility:'private',
    sourceLocale:typeof input.sourceLocale==='string'?input.sourceLocale.trim():'',
    region:copy(input.region), category:input.category, transport:'walk',
    durationMinutes:whole(input.durationMinutes),
    cost:{amount:amount(input.costAmount),currency:typeof input.currency==='string'?input.currency.trim().toUpperCase():''},
    title:typeof input.title==='string'?input.title.trim():'',
    description:typeof input.description==='string'?input.description.trim():'',
    place:typeof input.place==='string'?input.place.trim():'',
    tip:typeof input.tip==='string'?input.tip.trim():'',
    points:Array.isArray(input.points)?input.points.map(point=>({id:point.id,text:typeof point.text==='string'?point.text.trim():''})):[],
  };
  return validateUnitDraft(draft);
}

export function saveUnitDraft(state, draft) {
  assertState(state); validateUnitDraft(draft);
  const exists=state.unitDrafts.some(current=>current.id===draft.id);
  const unitDrafts=exists
    ? state.unitDrafts.map(current=>current.id===draft.id?copy(draft):current)
    : [...state.unitDrafts,copy(draft)];
  return assertState({...state,unitDrafts});
}

export function deleteUnitDraft(state, draftId) {
  assertState(state);
  if (!state.unitDrafts.some(draft=>draft.id===draftId)) throw new Error('invalidUnitDraft');
  return assertState({...state,unitDrafts:state.unitDrafts.filter(draft=>draft.id!==draftId)});
}

export function draftFromLatest(state, unitId, draftId) {
  assertState(state);
  const local=state.localUnits.find(unit=>unit.id===unitId);
  const latest=local?.versions[local.versions.length-1];
  if (!latest || state.unitDrafts.some(draft=>draft.id===draftId || draft.unitId===unitId)) throw new Error('invalidUnitDraft');
  const locale=latest.sourceLocale;
  return validateUnitDraft({
    id:draftId, unitId, baseVersionId:latest.versionId, visibility:'private', sourceLocale:locale,
    region:copy(latest.region), category:latest.category, transport:'walk', durationMinutes:latest.durationMinutes,
    cost:copy(latest.cost), title:latest.title[locale], description:latest.description[locale],
    place:latest.place[locale], tip:latest.tip[locale],
    points:latest.points.map(point=>({id:point.id,text:point.text[locale]})),
  });
}

export function publishUnitDraft(state, draft, {newUnitId = null, versionId}) {
  const withDraft=saveUnitDraft(state,draft);
  const saved=withDraft.unitDrafts.find(current=>current.id===draft.id);
  const existing=saved.unitId===null?null:withDraft.localUnits.find(unit=>unit.id===saved.unitId);
  if (saved.unitId!==null && !existing) throw new Error('invalidUnitDraft');
  const id=existing?.id ?? newUnitId;
  if (!id || (!existing && withDraft.localUnits.some(unit=>unit.id===id))) throw new Error('invalidUnitDraft');
  const number=(existing?.versions.length ?? 0)+1;
  const locale=saved.sourceLocale;
  const version=validateUnit({
    id, versionId, version:number, sourceLocale:locale, sourceType:'user_authored', growth:'seed',
    author:'local-device', region:copy(saved.region), category:saved.category, transport:'walk',
    durationMinutes:saved.durationMinutes, cost:copy(saved.cost), title:{[locale]:saved.title},
    description:{[locale]:saved.description}, place:{[locale]:saved.place}, tip:{[locale]:saved.tip},
    points:saved.points.map(point=>({id:point.id,text:{[locale]:point.text}})),
  });
  const localUnits=existing
    ? withDraft.localUnits.map(unit=>unit.id===id?{...unit,versions:[...unit.versions,copy(version)]}:unit)
    : [...withDraft.localUnits,{id,visibility:'private',versions:[copy(version)]}];
  return assertState({...withDraft,localUnits,unitDrafts:withDraft.unitDrafts.filter(current=>current.id!==saved.id)});
}
