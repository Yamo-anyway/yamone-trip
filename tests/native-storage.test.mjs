import test from 'node:test';
import assert from 'node:assert/strict';
import { NativeRepository, NATIVE_STORAGE_KEY } from '../native/storage.js';
import { initialState, createTrip, addItem, createRecord } from '../src/domain.js';
import { catalog } from '../src/catalog.js';

function storage(raw = null) {
  return {
    raw, writes: 0, readFailure: false, writeFailure: false,
    async getItem(key) { assert.equal(key, NATIVE_STORAGE_KEY); if (this.readFailure) throw Error('disk'); return this.raw; },
    async setItem(key, value) { assert.equal(key, NATIVE_STORAGE_KEY); if (this.writeFailure) throw Error('disk full'); this.raw = value; this.writes++; },
  };
}
const preference = value => state => ({...state, preference:value});

test('shared domain and native reload work without structuredClone', async () => {
  const original = globalThis.structuredClone;
  try {
    globalThis.structuredClone = undefined;
    let trip = createTrip({name:'Synthetic native test',startDate:'2026-10-01',endDate:'2026-10-01',region:catalog[0].region}, 'native-test');
    trip = addItem(trip, catalog[0], {date:'2026-10-01',startTime:'09:00'}, 'native-item');
    assert.notEqual(trip.region, catalog[0].region);
    assert.notEqual(trip.items[0].snapshot.points, catalog[0].points);
    const disk = storage(JSON.stringify({...initialState(), trips:[trip]}));
    assert.deepEqual((await new NativeRepository(disk).load()).trips, [trip]);
  } finally { globalThis.structuredClone = original; }
});

test('native empty load does not create or claim an account, or write storage', async () => {
  const disk = storage(), repo = new NativeRepository(disk);
  assert.deepEqual(await repo.load(), initialState()); assert.equal(disk.writes, 0);
});
test('native schema-v1 load migrates only in memory until an explicit write', async () => {
  const old=JSON.stringify({schemaVersion:1,preference:'ko',trips:[],records:{}});
  const disk=storage(old), repo=new NativeRepository(disk); const loaded=await repo.load();
  assert.equal(loaded.schemaVersion,2); assert.deepEqual(loaded.localUnits,[]); assert.equal(disk.raw,old); assert.equal(disk.writes,0);
  await repo.transact(state=>state); assert.equal(JSON.parse(disk.raw).schemaVersion,2); assert.equal(disk.writes,1);
});
test('native load is required before any write', async () => {
  const disk = storage(), repo = new NativeRepository(disk);
  await assert.rejects(repo.transact(preference('ko')), /loadError/); assert.equal(disk.raw, null);
});
test('native preference round trip and returned object isolation', async () => {
  const disk = storage(), repo = new NativeRepository(disk);
  const loaded = await repo.load(); loaded.preference = 'ko';
  const result = await repo.transact(state => state);
  assert.equal(result.preference, 'auto'); result.preference = 'en';
  await repo.transact(preference('ko'));
  assert.equal((await new NativeRepository(disk).load()).preference, 'ko');
});
test('native corrupt JSON, invalid schema and read failure never overwrite', async () => {
  for (const raw of ['{bad', '{"schemaVersion":999}', 'null']) {
    const disk = storage(raw), repo = new NativeRepository(disk);
    await assert.rejects(repo.load(), /loadError/);
    await assert.rejects(repo.transact(preference('ko')), /loadError/);
    assert.equal(disk.raw, raw); assert.equal(disk.writes, 0);
  }
  const disk = storage(); disk.readFailure = true;
  await assert.rejects(new NativeRepository(disk).load(), /loadError/); assert.equal(disk.writes, 0);
});
test('native write failure preserves bytes and requires reload', async () => {
  const disk = storage(JSON.stringify(initialState())), repo = new NativeRepository(disk);
  await repo.load(); const before = disk.raw; disk.writeFailure = true;
  await assert.rejects(repo.transact(preference('ko')), /storageError/);
  assert.equal(disk.raw, before);
  disk.writeFailure = false;
  await assert.rejects(repo.transact(preference('en')), /loadError/);
  await repo.load(); await repo.transact(preference('en'));
  assert.equal(JSON.parse(disk.raw).preference, 'en');
});
test('native stale writer refuses to overwrite external changes', async () => {
  const disk = storage(), repo = new NativeRepository(disk); await repo.load();
  disk.raw = JSON.stringify({...initialState(), preference:'en'}); const before = disk.raw;
  await assert.rejects(repo.transact(preference('ko')), /storageError/);
  assert.equal(disk.raw, before); assert.equal(disk.writes, 0);
});
test('native transactions serialize and compose on latest committed state', async () => {
  const disk = storage(), repo = new NativeRepository(disk); await repo.load();
  await Promise.all([repo.transact(preference('ko')), repo.transact(state => {
    assert.equal(state.preference, 'ko'); return {...state, preference:'en'};
  })]);
  assert.equal(JSON.parse(disk.raw).preference, 'en'); assert.equal(disk.writes, 2);
});
test('native invalid transactions are rejected without poisoning the queue', async () => {
  const disk = storage(), repo = new NativeRepository(disk); await repo.load();
  await assert.rejects(repo.transact(preference('ja')), /loadError/); assert.equal(disk.writes, 0);
  await repo.transact(preference('ko')); assert.equal(disk.writes, 1);
});
test('native preference changes preserve trip snapshots, records and notes', async () => {
  let trip = createTrip({name:'Synthetic test',startDate:'2026-10-01',endDate:'2026-10-01',region:catalog[0].region}, 'trip-test');
  trip = addItem(trip, catalog[0], {date:'2026-10-01',startTime:'09:00'}, 'item-test');
  const item = trip.items[0]; const record = createRecord(item, [item.snapshot.points[0].id], 'Synthetic test note');
  const state = {...initialState(), trips:[trip], records:{[item.id]:record}};
  const disk = storage(JSON.stringify(state)), repo = new NativeRepository(disk); await repo.load();
  const result = await repo.transact(preference('en'));
  assert.deepEqual(result.trips, state.trips); assert.deepEqual(result.records, state.records);
});
test('native read failure during transaction requires reload without mutation', async () => {
  const disk = storage(), repo = new NativeRepository(disk); await repo.load(); disk.readFailure = true;
  await assert.rejects(repo.transact(preference('ko')), /storageError/); assert.equal(disk.writes, 0);
});
