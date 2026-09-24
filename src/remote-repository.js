// Proposed server repository boundary. It is not imported by either app and is exercised with injected mocks only.
import { validDate } from './domain.js';
const validId=value=>typeof value==='string' && /^[A-Za-z0-9_-]{1,128}$/.test(value);
const text=(value,max)=>typeof value==='string' && value.trim() && value.trim().length<=max?value.trim():null;

function id(value) {
  if (!validId(value)) throw new Error('invalidRemoteInput');
  return value;
}

function region(value) {
  if (!value || !['country','city','district'].every(key=>validId(value[key]))) throw new Error('invalidRemoteInput');
  return {country:value.country,city:value.city,district:value.district};
}

function localDate(value) {
  if (!validDate(value)) throw new Error('invalidRemoteInput');
  return value;
}

function localTime(value) {
  if (typeof value!=='string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) throw new Error('invalidRemoteInput');
  return value;
}

function whole(value,{minimum=0,maximum=1440}={}) {
  if (!Number.isInteger(value) || value<minimum || value>maximum) throw new Error('invalidRemoteInput');
  return value;
}

export class FutureRemoteRepository {
  constructor(client) {
    if (!client || typeof client.request!=='function') throw new Error('invalidRemoteInput');
    this.client=client;
  }

  listUnits(input={},{signal}={}) {
    const selected=region(input.region);
    const locale=['ko','en'].includes(input.locale)?input.locale:null;
    if (!locale) throw new Error('invalidRemoteInput');
    const query=new URLSearchParams({...selected,locale});
    if (input.query) {
      const value=text(input.query,120); if (!value) throw new Error('invalidRemoteInput'); query.set('q',value);
    }
    if (input.cursor) {
      const value=text(input.cursor,256); if (!value) throw new Error('invalidRemoteInput'); query.set('cursor',value);
    }
    return this.client.request(`/v1/units?${query}`,{signal});
  }

  getUnit(unitId,versionId,{signal}={}) {
    return this.client.request(`/v1/units/${id(unitId)}/versions/${id(versionId)}`,{signal});
  }

  createTrip(input,{idempotencyKey,signal}={}) {
    const name=text(input?.name,80);
    if (!name) throw new Error('invalidRemoteInput');
    const body={name,startDate:localDate(input.startDate),endDate:localDate(input.endDate),region:region(input.region)};
    if (body.endDate<body.startDate) throw new Error('invalidRemoteInput');
    return this.client.request('/v1/trips',{method:'POST',body,idempotencyKey,signal});
  }

  addTripItem(tripId,input,{idempotencyKey,signal}={}) {
    const body={date:localDate(input?.date),startTime:localTime(input?.startTime),unitId:id(input?.unitId),unitVersionId:id(input?.unitVersionId)};
    return this.client.request(`/v1/trips/${id(tripId)}/items`,{method:'POST',body,idempotencyKey,signal});
  }

  updateTripItem(tripId,itemId,patch,{idempotencyKey,revision,signal}={}) {
    const allowed=['date','startTime','durationMinutes','movementMinutes','breakMinutes'];
    if (!patch || !Object.keys(patch).length || Object.keys(patch).some(key=>!allowed.includes(key))) throw new Error('invalidRemoteInput');
    const body={};
    if ('date' in patch) body.date=localDate(patch.date);
    if ('startTime' in patch) body.startTime=localTime(patch.startTime);
    for (const key of ['durationMinutes','movementMinutes','breakMinutes']) if (key in patch) body[key]=whole(patch[key],{minimum:key==='durationMinutes'?1:0});
    return this.client.request(`/v1/trips/${id(tripId)}/items/${id(itemId)}`,{method:'PATCH',body,idempotencyKey,revision,signal});
  }

  saveExperienceRecord(tripId,itemId,input,{idempotencyKey,revision,signal}={}) {
    if (!Array.isArray(input?.checkedIds) || new Set(input.checkedIds).size!==input.checkedIds.length || input.checkedIds.some(value=>!validId(value)) ||
      typeof input.note!=='string' || input.note.length>2000 || typeof input.skipped!=='boolean' || (input.skipped && input.checkedIds.length)) throw new Error('invalidRemoteInput');
    const body={checkedIds:[...input.checkedIds],note:input.note,skipped:input.skipped};
    return this.client.request(`/v1/trips/${id(tripId)}/items/${id(itemId)}/record`,{method:'PUT',body,idempotencyKey,revision,signal});
  }
}
