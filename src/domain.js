export const SCHEMA_VERSION = 1;
// Domain DTOs cross JSON storage/API boundaries. Do not require browser-only globals.
const cloneDto = value => JSON.parse(JSON.stringify(value));
const validId = value => typeof value==='string' && /^[A-Za-z0-9_-]{1,128}$/.test(value);
export function initialState() {
  return { schemaVersion:SCHEMA_VERSION, preference:'auto', trips:[], records:{} };
}
export function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(value + 'T00:00:00Z');
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0,10) === value;
}
export function dateRange(start, end) {
  if (!validDate(start) || !validDate(end) || end < start) throw new Error('invalidTrip');
  const days = (Date.parse(end+'T00:00:00Z') - Date.parse(start+'T00:00:00Z')) / 86400000 + 1;
  if (days > 90) throw new Error('invalidTrip');
  return Array.from({length:days},(_,i)=>new Date(Date.parse(start+'T00:00:00Z')+i*86400000).toISOString().slice(0,10));
}
export function minutesOf(value) {
  if (typeof value !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) throw new Error('invalidSchedule');
  return Number(value.slice(0,2))*60 + Number(value.slice(3));
}
export function timeOf(minutes) { return `${String(Math.floor(minutes/60)).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}`; }
export function validateUnit(unit) {
  if (!unit || typeof unit.id !== 'string' || !unit.id || typeof unit.versionId !== 'string' || !unit.versionId || !unit.title || typeof unit.title !== 'object' || !Object.values(unit.title).every(v=>typeof v==='string') || !Object.values(unit.title).some(v=>v.trim())) throw new Error('invalid');
  if (!Number.isInteger(unit.durationMinutes) || unit.durationMinutes<1 || unit.durationMinutes>1440) throw new Error('invalid');
  if (!['walk','cafe','sightseeing'].includes(unit.category) || unit.transport!=='walk' || !['seed','sprout'].includes(unit.growth) || !['first_hand','ai_draft'].includes(unit.sourceType)) throw new Error('invalid');
  if (typeof unit.sourceLocale!=='string' || typeof unit.author!=='string' || !Number.isInteger(unit.version) || unit.version<1) throw new Error('invalid');
  if (!unit.region || ['country','city','district'].some(k=>typeof unit.region[k]!=='string' || !unit.region[k])) throw new Error('invalid');
  if (!unit.cost || !Number.isFinite(unit.cost.amount) || unit.cost.amount<0 || !/^[A-Z]{3}$/.test(unit.cost.currency)) throw new Error('invalid');
  for (const key of ['description','place','tip']) if (!unit[key] || typeof unit[key]!=='object' || Array.isArray(unit[key]) || !Object.values(unit[key]).every(v=>typeof v==='string')) throw new Error('invalid');
  if (!Array.isArray(unit.points) || unit.points.length<1 || unit.points.length>5) throw new Error('invalid');
  const ids = new Set();
  for (const p of unit.points) {
    if (!p || typeof p.id!=='string' || !p.id || ids.has(p.id) || !p.text || !Object.values(p.text).every(v=>typeof v==='string') || !Object.values(p.text).some(v=>v.trim())) throw new Error('invalid');
    ids.add(p.id);
  }
  return unit;
}
export function createTrip({name,startDate,endDate,region},id) {
  if (typeof name!=='string' || !name.trim() || name.trim().length>80 || !region?.country || !region?.city || !region?.district) throw new Error('invalidTrip');
  dateRange(startDate,endDate);
  return {id,name:name.trim(),startDate,endDate,region:cloneDto(region),visibility:'private',items:[]};
}
export function scheduleEnd(item) {
  const values=[item.durationMinutes,item.movementMinutes===undefined?0:item.movementMinutes,item.breakMinutes===undefined?0:item.breakMinutes];
  if (values.some(v=>!Number.isInteger(v) || v<0 || v>1440) || values[0]<1) throw new Error('invalidSchedule');
  const end=minutesOf(item.startTime)+values.reduce((sum,v)=>sum+v,0);
  if (end>1440) throw new Error('invalidSchedule');
  return end;
}
function validateSchedule(trip,item) {
  if (!dateRange(trip.startDate,trip.endDate).includes(item.date)) throw new Error('invalidSchedule');
  scheduleEnd(item);
}
export function sortedItems(items) {
  return [...items].sort((a,b)=>a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
}
export function updateItem(trip,itemId,patch) {
  const keys=['date','startTime','durationMinutes','movementMinutes','breakMinutes'];
  if (!patch || typeof patch!=='object' || Array.isArray(patch) || Object.keys(patch).some(k=>!keys.includes(k) || patch[k]===undefined)) throw new Error('invalidSchedule');
  const index=trip.items.findIndex(item=>item.id===itemId);
  if (index<0) throw new Error('invalidSchedule');
  const item={...trip.items[index],...patch};
  validateSchedule(trip,item);
  return {...trip,items:trip.items.map((previous,i)=>i===index?item:previous)};
}
export function addItem(trip,unit,{date,startTime},id) {
  validateUnit(unit);
  const item={id,date,startTime,durationMinutes:unit.durationMinutes,movementMinutes:0,breakMinutes:0,unitId:unit.id,unitVersionId:unit.versionId,snapshot:cloneDto(unit)};
  validateSchedule(trip,item);
  return {...trip,items:[...trip.items,item]};
}
export function findConflicts(items) {
  const pairs=[];
  for (let i=0;i<items.length;i++) for (let j=i+1;j<items.length;j++) {
    const a=items[i],b=items[j];
    if (a.date!==b.date) continue;
    const startA=minutesOf(a.startTime),startB=minutesOf(b.startTime);
    if (startA<scheduleEnd(b) && startB<scheduleEnd(a)) pairs.push([a.id,b.id]);
  }
  return pairs;
}
export function createRecord(item,checkedIds,note,skip=false) {
  if (!Array.isArray(checkedIds) || typeof note!=='string' || note.length>2000) throw new Error('invalid');
  const allowed = new Set(item.snapshot.points.map(p=>p.id));
  if (checkedIds.some(id=>!allowed.has(id)) || new Set(checkedIds).size!==checkedIds.length || (skip && checkedIds.length)) throw new Error('invalid');
  const status=skip?'skipped':checkedIds.length===allowed.size?'complete':checkedIds.length?'partial':'planned';
  return {scheduleItemId:item.id,unitVersionId:item.unitVersionId,checkedIds:[...checkedIds],note,status,verification:'self_reported'};
}
export function filterUnits(units,{query='',maxMinutes=0,category='',maxCost=null,region=null}={}) {
  const q=query.trim().toLocaleLowerCase();
  return units.filter(u=>(!region || Object.entries(region).every(([k,v])=>u.region[k]===v))
    && (!maxMinutes || u.durationMinutes<=Number(maxMinutes))
    && (!category || u.category===category)
    && (maxCost===null || u.cost.amount<=Number(maxCost))
    && (!q || [...Object.values(u.title),...Object.values(u.description),...Object.values(u.place)].join(' ').toLocaleLowerCase().includes(q)));
}
export function assertState(state) {
  if (!state || state.schemaVersion!==SCHEMA_VERSION || !['auto','ko','en'].includes(state.preference) || !Array.isArray(state.trips) || !state.records || typeof state.records!=='object' || Array.isArray(state.records)) throw new Error('loadError');
  const ids=new Set(),tripIds=new Set();
  for (const trip of state.trips) {
    createTrip(trip,trip.id);
    if (!validId(trip.id) || tripIds.has(trip.id) || trip.visibility!=='private' || !Array.isArray(trip.items)) throw new Error('loadError');
    tripIds.add(trip.id);
    for (const item of trip.items) {
      validateUnit(item.snapshot);
      validateSchedule(trip,item);
      if (!validId(item.id) || ids.has(item.id) || !dateRange(trip.startDate,trip.endDate).includes(item.date) || !Number.isInteger(item.durationMinutes) || item.durationMinutes<1 || minutesOf(item.startTime)+item.durationMinutes>1440 || item.unitVersionId!==item.snapshot.versionId || item.unitId!==item.snapshot.id) throw new Error('loadError');
      ids.add(item.id);
    }
  }
  for (const [id,record] of Object.entries(state.records)) {
    const item=state.trips.flatMap(t=>t.items).find(i=>i.id===id);
    if (!item || record.scheduleItemId!==id || record.unitVersionId!==item.unitVersionId || record.verification!=='self_reported') throw new Error('loadError');
    const checked=createRecord(item,record.checkedIds,record.note,record.status==='skipped');
    if (checked.status!==record.status) throw new Error('loadError');
  }
  return state;
}
