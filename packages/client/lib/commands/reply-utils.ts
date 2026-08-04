/**
 * Shared primitives for parsing "map-like" replies that can arrive in any of
 * four shapes depending on protocol version and `typeMapping`:
 *
 *   - JS `Map` (RESP3 + `typeMapping[RESP_TYPES.MAP] = Map`)
 *   - Plain object (RESP3 default)
 *   - Flat key/value `Array` (RESP2, or `typeMapping[RESP_TYPES.MAP] = Array`)
 *   - Tuple `Array` of `[key, value]` pairs (older RESP2 wire shapes)
 *
 * Helpers here normalize over all four so transforms don't have to branch
 * on protocol version.
 */

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    !(value instanceof Map) &&
    !ArrayBuffer.isView(value) &&
    Object.prototype.toString.call(value) === '[object Object]';
}

export function keyToString(key: unknown): string {
  if (key === null || key === undefined) return '';
  return (key as { toString(): string }).toString();
}

export function mapLikeEntries(value: unknown): Array<[string, unknown]> {
  if (value instanceof Map) {
    return Array.from(value.entries(), ([key, entryValue]) => [keyToString(key), entryValue]);
  }

  if (Array.isArray(value)) {
    if (
      value.length === 1 &&
      (Array.isArray(value[0]) || value[0] instanceof Map || isPlainObject(value[0]))
    ) {
      return mapLikeEntries(value[0]);
    }

    if (value.every(item => Array.isArray(item) && item.length >= 2)) {
      return value.map(item => [keyToString(item[0]), item[1]]);
    }

    const entries: Array<[string, unknown]> = [];
    for (let i = 0; i < value.length - 1; i += 2) {
      entries.push([keyToString(value[i]), value[i + 1]]);
    }
    return entries;
  }

  if (isPlainObject(value)) {
    return Object.entries(value);
  }

  return [];
}

export function mapLikeValues(value: unknown): Array<unknown> {
  if (Array.isArray(value)) return value;
  if (value instanceof Map) return [...value.values()];
  if (isPlainObject(value)) return Object.values(value);
  return [];
}

export function mapLikeToObject(value: unknown): Record<string, unknown> {
  const object: Record<string, unknown> = {};
  for (const [key, entryValue] of mapLikeEntries(value)) {
    object[key] = entryValue;
  }
  return object;
}

export function mapLikeToFlatArray(value: unknown): Array<unknown> {
  const flat: Array<unknown> = [];
  for (const [key, entryValue] of mapLikeEntries(value)) {
    flat.push(key, entryValue);
  }
  return flat;
}

export function getMapValue(value: unknown, keys: Array<string>): unknown {
  const object = mapLikeToObject(value);

  for (const key of keys) {
    if (Object.hasOwn(object, key)) {
      return object[key];
    }
  }

  const lowerCaseKeyToOriginal = new Map<string, string>();
  for (const key of Object.keys(object)) {
    const lowerCaseKey = key.toLowerCase();
    if (!lowerCaseKeyToOriginal.has(lowerCaseKey)) {
      lowerCaseKeyToOriginal.set(lowerCaseKey, key);
    }
  }

  for (const key of keys) {
    const original = lowerCaseKeyToOriginal.get(key.toLowerCase());
    if (original !== undefined) {
      return object[original];
    }
  }

  return undefined;
}
