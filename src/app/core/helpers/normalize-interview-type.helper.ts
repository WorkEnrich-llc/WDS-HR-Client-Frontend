/**
 * Maps API `interview_type` to form codes: 1 = offline, 2 = online.
 * Handles numbers, string ids, "Online"/"Offline", and { id, name } objects.
 */
export function normalizeInterviewTypeCode(raw: unknown): 1 | 2 {
  if (raw === null || raw === undefined || raw === '') {
    return 1;
  }
  if (typeof raw === 'object' && raw !== null) {
    const o = raw as Record<string, unknown>;
    // Some callers may pass the whole interview object instead of interview_type directly.
    if (o['interview_type'] !== undefined) {
      return normalizeInterviewTypeCode(o['interview_type']);
    }

    if (typeof o['name'] === 'string') {
      const n = o['name'].trim().toLowerCase();
      if (n === 'online') return 2;
      if (n === 'offline') return 1;
    }
    if (typeof o['value'] === 'string') {
      const v = o['value'].trim().toLowerCase();
      if (v === 'online') return 2;
      if (v === 'offline') return 1;
    }
    if (typeof o['label'] === 'string') {
      const l = o['label'].trim().toLowerCase();
      if (l === 'online') return 2;
      if (l === 'offline') return 1;
    }
    if (o['id'] != null && !Number.isNaN(Number(o['id']))) {
      const id = Number(o['id']);
      if (id === 2) return 2;
      if (id === 1) return 1;
    }
  }
  if (typeof raw === 'number') {
    return raw === 2 ? 2 : 1;
  }
  if (typeof raw === 'string') {
    const s = raw.trim().toLowerCase();
    if (s === '2' || s === 'online') return 2;
    if (s === '1' || s === 'offline') return 1;
  }
  return 1;
}
