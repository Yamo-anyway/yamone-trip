const validPrefix = value => typeof value === 'string' && /^[a-z][a-z0-9-]{0,15}$/.test(value);

// Local opaque IDs only. The future server must issue/validate its own identifiers.
export function createIdGenerator({now = Date.now, random = Math.random} = {}) {
  let sequence = 0;
  return {
    next(prefix, existing = []) {
      if (!validPrefix(prefix)) throw new Error('invalid');
      const used = new Set(existing);
      for (let attempt = 0; attempt < 32; attempt++) {
        sequence = (sequence + 1) % 1679616;
        const time = Math.max(0, Math.trunc(now())).toString(36);
        const entropy = Math.floor(Math.max(0, Math.min(0.999999999999, random())) * 2176782336).toString(36).padStart(6, '0');
        const id = `${prefix}-${time}-${sequence.toString(36)}-${entropy}`;
        if (!used.has(id)) return id;
      }
      throw new Error('invalid');
    },
  };
}
