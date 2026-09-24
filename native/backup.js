import { assertState, SCHEMA_VERSION } from '../src/domain.js';

export const BACKUP_FORMAT = 'yamone-trip-local-backup';
export const BACKUP_FORMAT_VERSION = 1;
export const MAX_BACKUP_BYTES = 10 * 1024 * 1024;

const copy = value => JSON.parse(JSON.stringify(value));

function utf8Size(value) {
  let size = 0;
  for (let index = 0; index < value.length; index++) {
    const code = value.charCodeAt(index);
    if (code < 0x80) size++;
    else if (code < 0x800) size += 2;
    else if (code >= 0xd800 && code <= 0xdbff && value.charCodeAt(index + 1) >= 0xdc00 && value.charCodeAt(index + 1) <= 0xdfff) {
      size += 4; index++;
    } else size += 3;
  }
  return size;
}

function cleanLocalized(value) {
  const entries = Object.entries(value).filter(([key, text]) =>
    typeof key === 'string' && key.length > 0 && key.length <= 35 &&
    !['__proto__', 'prototype', 'constructor'].includes(key) && typeof text === 'string');
  return Object.fromEntries(entries);
}

function cleanUnit(unit) {
  return {
    id:unit.id, versionId:unit.versionId, version:unit.version, sourceLocale:unit.sourceLocale,
    sourceType:unit.sourceType, growth:unit.growth, author:unit.author,
    region:{country:unit.region.country, city:unit.region.city, district:unit.region.district},
    category:unit.category, transport:unit.transport, durationMinutes:unit.durationMinutes,
    cost:{amount:unit.cost.amount, currency:unit.cost.currency}, title:cleanLocalized(unit.title),
    description:cleanLocalized(unit.description), place:cleanLocalized(unit.place), tip:cleanLocalized(unit.tip),
    points:unit.points.map(point => ({id:point.id, text:cleanLocalized(point.text)})),
  };
}

/** Rebuild only schema-v1 fields so imported unknown data is never persisted. */
export function canonicalState(value) {
  assertState(value);
  const state = {
    schemaVersion:SCHEMA_VERSION,
    preference:value.preference,
    trips:value.trips.map(trip => ({
      id:trip.id, name:trip.name, startDate:trip.startDate, endDate:trip.endDate,
      region:{country:trip.region.country, city:trip.region.city, district:trip.region.district},
      visibility:'private',
      items:trip.items.map(item => ({
        id:item.id, date:item.date, startTime:item.startTime, durationMinutes:item.durationMinutes,
        movementMinutes:item.movementMinutes ?? 0, breakMinutes:item.breakMinutes ?? 0,
        unitId:item.unitId, unitVersionId:item.unitVersionId, snapshot:cleanUnit(item.snapshot),
      })),
    })),
    records:Object.fromEntries(Object.entries(value.records).map(([id, record]) => [id, {
      scheduleItemId:record.scheduleItemId, unitVersionId:record.unitVersionId,
      checkedIds:[...record.checkedIds], note:record.note, status:record.status,
      verification:'self_reported',
    }])),
  };
  assertState(state);
  return state;
}

function validCreatedAt(value) {
  if (typeof value !== 'string' || value.length > 40) return false;
  const time = Date.parse(value);
  return Number.isFinite(time) && new Date(time).toISOString() === value;
}

export function createBackup(state, {createdAt, appVersion}) {
  if (!validCreatedAt(createdAt) || typeof appVersion !== 'string' || !/^\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?$/.test(appVersion)) {
    throw new Error('backupError');
  }
  const envelope = {
    format:BACKUP_FORMAT, formatVersion:BACKUP_FORMAT_VERSION, createdAt, appVersion,
    state:canonicalState(state),
  };
  const text = JSON.stringify(envelope);
  if (utf8Size(text) > MAX_BACKUP_BYTES) throw new Error('backupTooLarge');
  return text;
}

export function backupPreview(state, metadata = {}) {
  const itemCount = state.trips.reduce((sum, trip) => sum + trip.items.length, 0);
  return {
    source:metadata.source ?? 'backup_v1', createdAt:metadata.createdAt ?? null,
    appVersion:metadata.appVersion ?? null, preference:state.preference,
    tripCount:state.trips.length, itemCount, recordCount:Object.keys(state.records).length,
  };
}

/** Parsing and full validation are side-effect free. The caller must preview and confirm before writing. */
export function parseBackup(text) {
  if (typeof text !== 'string' || !text.trim() || utf8Size(text) > MAX_BACKUP_BYTES) throw new Error('backupTooLarge');
  let value;
  try { value = JSON.parse(text); } catch { throw new Error('backupInvalid'); }
  try {
    if (value?.format === BACKUP_FORMAT) {
      if (value.formatVersion !== BACKUP_FORMAT_VERSION) throw new Error('backupVersion');
      if (!validCreatedAt(value.createdAt) || typeof value.appVersion !== 'string') throw new Error('backupInvalid');
      const state = canonicalState(value.state);
      return {state:copy(state), preview:backupPreview(state, {createdAt:value.createdAt, appVersion:value.appVersion})};
    }
    // Explicit import path for the old raw schema-v1 local export/browser transfer.
    if (value?.schemaVersion === SCHEMA_VERSION) {
      const state = canonicalState(value);
      return {state:copy(state), preview:backupPreview(state, {source:'legacy_raw_v1'})};
    }
    throw new Error('backupVersion');
  } catch (error) {
    if (error instanceof Error && ['backupVersion','backupTooLarge'].includes(error.message)) throw error;
    throw new Error('backupInvalid');
  }
}
