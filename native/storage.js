import { assertState, initialState } from '../src/domain.js';

// Separate namespace: browser data is never silently imported or erased.
export const NATIVE_STORAGE_KEY = 'yamone-trip:native:state:v1';
const copy = value => JSON.parse(JSON.stringify(value));

/** One application-scoped writer. Serialized read/modify/write, not server CAS. */
export class NativeRepository {
  constructor(storage) {
    this.storage = storage;
    this.state = null;
    this.raw = null;
    this.ready = false;
    this.queue = Promise.resolve();
  }

  enqueue(work) {
    const result = this.queue.then(work);
    this.queue = result.catch(() => {});
    return result;
  }

  load() {
    return this.enqueue(async () => {
      this.ready = false;
      try {
        const raw = await this.storage.getItem(NATIVE_STORAGE_KEY);
        const state = raw === null ? initialState() : assertState(JSON.parse(raw));
        this.raw = raw;
        this.state = copy(state);
        this.ready = true;
        return copy(state);
      } catch {
        // Never create empty state on a read/parse/schema error.
        throw new Error('loadError');
      }
    });
  }

  transact(change) {
    return this.enqueue(async () => {
      if (!this.ready) throw new Error('loadError');
      const next = change(copy(this.state));
      assertState(next);
      const raw = JSON.stringify(next);
      try {
        if (await this.storage.getItem(NATIVE_STORAGE_KEY) !== this.raw) {
          this.ready = false;
          throw new Error('stale state');
        }
        await this.storage.setItem(NATIVE_STORAGE_KEY, raw);
      } catch {
        // A write can fail ambiguously. Require reload before another mutation.
        this.ready = false;
        throw new Error('storageError');
      }
      this.raw = raw;
      this.state = JSON.parse(raw);
      return copy(this.state);
    });
  }
}
