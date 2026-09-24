import test from 'node:test';
import assert from 'node:assert/strict';
import { catalog } from '../src/catalog.js';
import { addItem, createTrip, updateItem, sortedItems, scheduleEnd, findConflicts, initialState, assertState, createRecord } from '../src/domain.js';
import { LocalRepository, STORAGE_KEY } from '../src/repository.js';
import { dictionaries } from '../src/i18n.js';

const trip=()=>addItem(createTrip({name:'Demo',startDate:'2028-02-28',endDate:'2028-03-01',region:catalog[0].region},'trip'),catalog[0],{date:'2028-02-28',startTime:'09:00'},'one');
const memory=()=>{const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};};
const stateWithTrip=()=>({...initialState(),trips:[trip()]});

test('editing day/time/duration/estimates keeps identity, snapshot and input unchanged',()=>{
  const before=trip(), original=structuredClone(before);
  const after=updateItem(before,'one',{date:'2028-02-29',startTime:'10:00',durationMinutes:45,movementMinutes:15,breakMinutes:10});
  assert.deepEqual(before,original);
  assert.equal(after.items[0].id,'one');
  assert.equal(after.items[0].unitId,before.items[0].unitId);
  assert.equal(after.items[0].unitVersionId,before.items[0].unitVersionId);
  assert.deepEqual(after.items[0].snapshot,before.items[0].snapshot);
  assert.equal(after.items[0].snapshot.durationMinutes,30);
  assert.equal(scheduleEnd(after.items[0]),670);
});
test('time edits reorder within day; equal times retain insertion order; sort does not mutate',()=>{
  const t=addItem(trip(),catalog[1],{date:'2028-02-28',startTime:'09:30'},'two');
  const changed=updateItem(t,'one',{startTime:'10:00'});
  assert.deepEqual(sortedItems(changed.items).map(i=>i.id),['two','one']);
  assert.deepEqual(changed.items.map(i=>i.id),['one','two']);
  assert.deepEqual(sortedItems(updateItem(t,'one',{startTime:'09:30'}).items).map(i=>i.id),['one','two']);
  assert.deepEqual(sortedItems(updateItem(t,'one',{date:'2028-02-29'}).items).map(i=>i.id),['two','one']);
});
test('buffers participate in conflicts but adjacent endpoints and other days do not',()=>{
  let t=updateItem(trip(),'one',{movementMinutes:15,breakMinutes:15});
  t=addItem(t,catalog[0],{date:'2028-02-28',startTime:'09:45'},'two');
  assert.deepEqual(findConflicts(t.items),[['one','two']]);
  assert.deepEqual(findConflicts([...t.items].reverse()),[['two','one']]);
  assert.deepEqual(findConflicts(updateItem(t,'two',{startTime:'10:00'}).items),[]);
  assert.deepEqual(findConflicts(updateItem(t,'two',{date:'2028-02-29'}).items),[]);
});
test('buffer midnight boundary is inclusive at 24:00 and rejects any overrun',()=>{
  const t=updateItem(trip(),'one',{startTime:'23:00',durationMinutes:30,movementMinutes:20,breakMinutes:10});
  assert.equal(scheduleEnd(t.items[0]),1440);
  assert.throws(()=>updateItem(t,'one',{breakMinutes:11}),/invalidSchedule/);
  assert.throws(()=>updateItem(t,'one',{startTime:'24:00'}),/invalidSchedule/);
});
test('calendar edits reject nonexistent and out-of-trip dates',()=>{
  for (const date of ['2028-02-30','2027-02-29','2028-02-27','2028-03-02','2028-2-29','']) {
    assert.throws(()=>updateItem(trip(),'one',{date}),/invalidSchedule/);
  }
  assert.equal(updateItem(trip(),'one',{date:'2028-02-29'}).items[0].date,'2028-02-29');
});
test('numeric schedule fields reject invalid types, fractions and negative values',()=>{
  for (const key of ['durationMinutes','movementMinutes','breakMinutes']) {
    for (const value of [-1,0.5,NaN,Infinity,'15',null,undefined,1441,true]) assert.throws(()=>updateItem(trip(),'one',{[key]:value}),/invalidSchedule/);
  }
  assert.throws(()=>updateItem(trip(),'one',{durationMinutes:0}),/invalidSchedule/);
  assert.equal(scheduleEnd(updateItem(trip(),'one',{startTime:'00:00',durationMinutes:1440}).items[0]),1440);
});
test('schedule edits cannot overwrite snapshot, identity, or private record fields',()=>{
  for (const key of ['id','unitId','unitVersionId','snapshot','note','checkedIds','visibility']) assert.throws(()=>updateItem(trip(),'one',{[key]:'changed'}),/invalidSchedule/);
  for (const patch of [null,[],42]) assert.throws(()=>updateItem(trip(),'one',patch),/invalidSchedule/);
  assert.throws(()=>updateItem(trip(),'missing',{startTime:'10:00'}),/invalidSchedule/);
});
test('editing and reloading preserve completion, notes and original content for both UI locales',()=>{
  for (const preference of ['ko','en']) {
    const storage=memory(), repo=new LocalRepository(storage); repo.load();
    const s=stateWithTrip();s.preference=preference;
    s.records.one=createRecord(s.trips[0].items[0],['walk'],'Private demo note');
    const records=structuredClone(s.records), snapshot=structuredClone(s.trips[0].items[0].snapshot);
    s.trips[0]=updateItem(s.trips[0],'one',{date:'2028-02-29',startTime:'10:00',durationMinutes:45,movementMinutes:10,breakMinutes:5});
    repo.save(s);
    const loaded=new LocalRepository(storage).load();
    assert.deepEqual(loaded,s);assert.deepEqual(loaded.records,records);assert.deepEqual(loaded.trips[0].items[0].snapshot,snapshot);
  }
});
test('legacy v1 schedules without estimates still load and edit without rewriting during load',()=>{
  const storage=memory(), s=stateWithTrip();delete s.trips[0].items[0].movementMinutes;delete s.trips[0].items[0].breakMinutes;
  const raw=JSON.stringify(s);storage.setItem(STORAGE_KEY,raw);
  const repo=new LocalRepository(storage), loaded=repo.load();
  assert.equal(storage.getItem(STORAGE_KEY),raw);assert.equal(scheduleEnd(loaded.trips[0].items[0]),570);
  loaded.trips[0]=updateItem(loaded.trips[0],'one',{movementMinutes:10});repo.save(loaded);
  assert.equal(scheduleEnd(new LocalRepository(storage).load().trips[0].items[0]),580);
});
test('corrupt stored estimates block writes and preserve raw storage',()=>{
  for (const patch of [{movementMinutes:null},{breakMinutes:-1},{breakMinutes:'10'},{movementMinutes:1440}]) {
    const s=stateWithTrip();Object.assign(s.trips[0].items[0],patch);assert.throws(()=>assertState(s));
    const storage=memory(), raw=JSON.stringify(s);storage.setItem(STORAGE_KEY,raw);
    const repo=new LocalRepository(storage);assert.throws(()=>repo.load(),/loadError/);assert.throws(()=>repo.save(initialState()),/loadError/);assert.equal(storage.getItem(STORAGE_KEY),raw);
  }
});
test('stale schedule editor cannot replace a concurrently saved note',()=>{
  const storage=memory(), first=new LocalRepository(storage); first.load(); first.save(stateWithTrip());
  const staleRepo=new LocalRepository(storage), stale=staleRepo.load(), current=first.load();
  current.records.one=createRecord(current.trips[0].items[0],[],'Keep this note');first.save(current);
  stale.trips[0]=updateItem(stale.trips[0],'one',{startTime:'10:00'});
  assert.throws(()=>staleRepo.save(stale),/storageError/);assert.deepEqual(new LocalRepository(storage).load(),current);
});
test('schedule editor provides concrete labels and validation in ko and en',()=>{
  for (const locale of ['ko','en']) for (const key of ['editSchedule','plannedDuration','movementMinutes','breakMinutes','scheduleHelp','plannedTime','movement','breakTime','reservedUntil','invalidSchedule','conflict']) assert(dictionaries[locale][key]?.trim(),`${locale}.${key}`);
  assert.match(dictionaries.ko.scheduleHelp,/직접/);assert.match(dictionaries.en.scheduleHelp,/manually/);
});
