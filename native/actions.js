import { addItem, assertState, createRecord, createTrip, updateItem } from '../src/domain.js';

function findTrip(state, tripId) {
  const index = state.trips.findIndex(trip => trip.id === tripId);
  if (index < 0) throw new Error('invalidTrip');
  return { index, trip: state.trips[index] };
}

function replaceTrip(state, index, trip) {
  return assertState({...state, trips:state.trips.map((current, i) => i === index ? trip : current)});
}

export function createPrivateTrip(state, input, id) {
  assertState(state);
  if (state.trips.some(trip => trip.id === id)) throw new Error('invalidTrip');
  const trip = createTrip(input, id);
  return assertState({...state, trips:[...state.trips, trip]});
}

export function addUnitToTrip(state, tripId, unit, schedule, itemId) {
  assertState(state);
  if (state.trips.some(trip => trip.items.some(item => item.id === itemId))) throw new Error('invalidSchedule');
  const {index, trip} = findTrip(state, tripId);
  return replaceTrip(state, index, addItem(trip, unit, schedule, itemId));
}

export function editTripItem(state, tripId, itemId, patch) {
  assertState(state);
  const {index, trip} = findTrip(state, tripId);
  return replaceTrip(state, index, updateItem(trip, itemId, patch));
}

export function saveExperienceRecord(state, tripId, itemId, checkedIds, note, skip = false) {
  assertState(state);
  const {trip} = findTrip(state, tripId);
  const item = trip.items.find(current => current.id === itemId);
  if (!item) throw new Error('invalid');
  const record = createRecord(item, checkedIds, note, skip);
  return assertState({...state, records:{...state.records, [itemId]:record}});
}

export function findTripItem(state, tripId, itemId) {
  const trip = state.trips.find(current => current.id === tripId);
  const item = trip?.items.find(current => current.id === itemId);
  return trip && item ? {trip, item, record:state.records[itemId] ?? null} : null;
}
