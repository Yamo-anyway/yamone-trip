import { assertState, validateImprovementProposal, validateSourceReference, validateUnit } from '../src/domain.js';
import { makeUnitDraft } from './authoring.js';

const copy=value=>JSON.parse(JSON.stringify(value));

export function sourceReference(unit) {
  validateUnit(unit);
  const locale=unit.sourceLocale;
  const title=unit.title[locale] ?? Object.values(unit.title).find(value=>value.trim());
  return validateSourceReference({
    unitId:unit.id,versionId:unit.versionId,version:unit.version,
    sourceLocale:locale,title,
  });
}

export function makeImprovementProposal(unit, suggestion, id) {
  return validateImprovementProposal({
    id,visibility:'private',status:'local_only',source:sourceReference(unit),
    suggestion:typeof suggestion==='string'?suggestion.trim():'',
  });
}

export function saveImprovementProposal(state, proposal) {
  assertState(state); validateImprovementProposal(proposal);
  if (state.improvementProposals.some(current=>current.id===proposal.id)) throw new Error('invalidImprovement');
  return assertState({...state,improvementProposals:[...state.improvementProposals,copy(proposal)]});
}

export function deleteImprovementProposal(state, proposalId) {
  assertState(state);
  if (!state.improvementProposals.some(proposal=>proposal.id===proposalId)) throw new Error('invalidImprovement');
  return assertState({...state,improvementProposals:state.improvementProposals.filter(proposal=>proposal.id!==proposalId)});
}

export function derivativeDraftFrom(unit, input, {draftId, pointIds}) {
  const reference=sourceReference(unit);
  if (!Array.isArray(pointIds) || pointIds.length!==unit.points.length) throw new Error('invalidLineage');
  return makeUnitDraft({
    sourceLocale:unit.sourceLocale,region:copy(unit.region),category:unit.category,
    durationMinutes:String(unit.durationMinutes),costAmount:String(unit.cost.amount),currency:unit.cost.currency,
    title:input.title,description:input.description,place:input.place,tip:input.tip,
    points:unit.points.map((point,index)=>({id:pointIds[index],text:input.points[index]})),
  },{draftId,derivedFrom:reference});
}
