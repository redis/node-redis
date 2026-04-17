function isPlainObject(value: unknown): value is Record<string, any> {
  return value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    !(value instanceof Map);
}

export function mapLikeEntries(value: unknown): Array<[string, any]> {
  if (value instanceof Map) {
    return Array.from(value.entries(), ([key, entryValue]) => [key.toString(), entryValue]);
  }

  if (Array.isArray(value)) {
    if (
      value.length === 1 &&
      (Array.isArray(value[0]) || value[0] instanceof Map || isPlainObject(value[0]))
    ) {
      return mapLikeEntries(value[0]);
    }

    if (value.every(item => Array.isArray(item) && item.length >= 2)) {
      return value.map(item => [item[0].toString(), item[1]]);
    }

    const entries: Array<[string, any]> = [];
    for (let i = 0; i < value.length - 1; i += 2) {
      entries.push([value[i].toString(), value[i + 1]]);
    }
    return entries;
  }

  if (isPlainObject(value)) {
    return Object.entries(value);
  }

  return [];
}

export function toCompatObject(value: Record<string, any>): Record<string, any> {
  const descriptors: PropertyDescriptorMap = {};

  for (const [key, entryValue] of Object.entries(value)) {
    descriptors[key] = {
      value: entryValue,
      configurable: true,
      enumerable: true
    };
  }

  return Object.defineProperties({}, descriptors);
}

export function mapLikeToObject(value: unknown): Record<string, any> {
  const object: Record<string, any> = {};
  for (const [key, entryValue] of mapLikeEntries(value)) {
    object[key] = entryValue;
  }
  return object;
}

export function mapLikeToFlatArray(value: unknown): Array<any> {
  const flat: Array<any> = [];
  for (const [key, entryValue] of mapLikeEntries(value)) {
    flat.push(key, entryValue);
  }
  return flat;
}

export function mapLikeValues(value: unknown): Array<any> {
  if (Array.isArray(value)) return value;
  if (value instanceof Map) return [...value.values()];
  if (isPlainObject(value)) return Object.values(value);
  return [];
}

export function getMapValue(value: unknown, keys: Array<string>): any {
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

function assignDocumentField(target: Record<string, any>, key: string, value: any): void {
  if (key === '$') {
    const json = value?.toString?.() ?? value;
    if (typeof json === 'string') {
      try {
        Object.assign(target, JSON.parse(json));
        return;
      } catch {
        // Fallback to setting the raw value below.
      }
    }
  }

  target[key] = value;
}

export function parseDocumentValue(value: unknown): Record<string, any> {
  const document: Record<string, any> = {};

  for (const [key, entryValue] of mapLikeEntries(value)) {
    assignDocumentField(document, key, entryValue);
  }

  return document;
}

function normalizeProfileValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(normalizeProfileValue);
  }

  if (value instanceof Map || isPlainObject(value)) {
    const normalized: Array<any> = [];
    for (const [key, entryValue] of mapLikeEntries(value)) {
      normalized.push(key, normalizeProfileValue(entryValue));
    }
    return normalized;
  }

  return value;
}

export function normalizeProfileReply(profile: unknown): unknown {
  return normalizeProfileValue(profile);
}

export function parseSearchResultRow(rawRow: unknown): {
  id: any;
  value: Record<string, any>;
} {
  const row = mapLikeToObject(rawRow);

  const value: Record<string, any> = {};
  Object.assign(value, parseDocumentValue(getMapValue(row, ['values'])));
  Object.assign(value, parseDocumentValue(getMapValue(row, ['extra_attributes', 'extraAttributes'])));

  return {
    id: getMapValue(row, ['id', 'doc_id']),
    value: toCompatObject(value)
  };
}

export function parseAggregateResultRow(rawRow: unknown): Record<string, any> {
  const row = mapLikeToObject(rawRow);

  const result: Record<string, any> = {};
  Object.assign(result, parseDocumentValue(getMapValue(row, ['values'])));
  Object.assign(result, parseDocumentValue(getMapValue(row, ['extra_attributes', 'extraAttributes'])));

  for (const [key, value] of Object.entries(row)) {
    if (
      key === 'id' ||
      key === 'values' ||
      key.toLowerCase() === 'extra_attributes' ||
      key === 'extraAttributes'
    ) {
      continue;
    }

    if (!Object.hasOwn(result, key)) {
      result[key] = value;
    }
  }

  return toCompatObject(result);
}
