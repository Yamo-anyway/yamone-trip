import { assertState, validateTranslationVariant, validateUnit } from '../src/domain.js';

const copy=value=>JSON.parse(JSON.stringify(value));

export function translationFor(state, unit, locale) {
  return state.translationVariants.find(variant=>variant.unitId===unit.id && variant.versionId===unit.versionId && variant.locale===locale) ?? null;
}

export function translationDraft(unit, locale, existing = null) {
  validateUnit(unit);
  if (!['ko','en'].includes(locale) || locale===unit.sourceLocale) throw new Error('invalidTranslation');
  if (existing) {
    validateTranslationVariant(existing);
    if (existing.unitId!==unit.id || existing.versionId!==unit.versionId || existing.locale!==locale ||
      JSON.stringify(existing.points.map(point=>point.id))!==JSON.stringify(unit.points.map(point=>point.id))) throw new Error('invalidTranslation');
  }
  const value=(field,fallback='')=>existing?.[field] ?? (typeof unit[field]?.[locale]==='string'?unit[field][locale]:fallback);
  return {
    title:value('title'),description:value('description'),place:value('place'),tip:value('tip'),
    points:unit.points.map((point,index)=>({id:point.id,text:existing?.points[index]?.text ?? point.text[locale] ?? ''})),
  };
}

export function makeTranslationVariant(unit, input, {locale, reviewStatus='draft', method='manual'}={}) {
  validateUnit(unit);
  const variant={
    unitId:unit.id,versionId:unit.versionId,sourceLocale:unit.sourceLocale,locale,method,reviewStatus,
    title:typeof input.title==='string'?input.title.trim():'',
    description:typeof input.description==='string'?input.description.trim():'',
    place:typeof input.place==='string'?input.place.trim():'',
    tip:typeof input.tip==='string'?input.tip.trim():'',
    points:Array.isArray(input.points)?input.points.map(point=>({id:point.id,text:typeof point.text==='string'?point.text.trim():''})):[],
  };
  validateTranslationVariant(variant);
  if (JSON.stringify(variant.points.map(point=>point.id))!==JSON.stringify(unit.points.map(point=>point.id))) throw new Error('invalidTranslation');
  return variant;
}

export function saveTranslationVariant(state, unit, variant) {
  assertState(state); validateUnit(unit); validateTranslationVariant(variant);
  if (variant.unitId!==unit.id || variant.versionId!==unit.versionId || variant.sourceLocale!==unit.sourceLocale ||
    JSON.stringify(variant.points.map(point=>point.id))!==JSON.stringify(unit.points.map(point=>point.id))) throw new Error('invalidTranslation');
  const key=current=>current.unitId===variant.unitId && current.versionId===variant.versionId && current.locale===variant.locale;
  const exists=state.translationVariants.some(key);
  const translationVariants=exists
    ? state.translationVariants.map(current=>key(current)?copy(variant):current)
    : [...state.translationVariants,copy(variant)];
  return assertState({...state,translationVariants});
}

export function deleteTranslationVariant(state, unitId, versionId, locale) {
  assertState(state);
  const key=variant=>variant.unitId===unitId && variant.versionId===versionId && variant.locale===locale;
  if (!state.translationVariants.some(key)) throw new Error('invalidTranslation');
  return assertState({...state,translationVariants:state.translationVariants.filter(variant=>!key(variant))});
}
