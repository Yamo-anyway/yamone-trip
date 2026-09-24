import {assertState,initialState,migrateState} from './domain.js';
export const STORAGE_KEY='yamone-trip:state:v1';
export class LocalRepository {
  constructor(storage) { this.storage=storage; this.readFailed=false; this.lastRead=null; }
  load() {
    try {
      const raw=this.storage.getItem(STORAGE_KEY);
      this.lastRead=raw;
      return raw===null?initialState():migrateState(JSON.parse(raw));
    } catch { this.readFailed=true; throw new Error('loadError'); }
  }
  save(state) {
    if (this.readFailed) throw new Error('loadError');
    assertState(state);
    try {
      if(this.storage.getItem(STORAGE_KEY)!==this.lastRead) throw new Error('storage changed in another tab');
      const raw=JSON.stringify(state);
      this.storage.setItem(STORAGE_KEY,raw); this.lastRead=raw;
    }
    catch { throw new Error('storageError'); }
    return state;
  }
}
