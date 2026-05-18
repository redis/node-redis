import {
  isPlainObject,
  mapLikeEntries,
  mapLikeValues,
  mapLikeToObject,
  mapLikeToFlatArray,
  getMapValue
} from '@redis/client/dist/lib/commands/reply-utils';

export {
  isPlainObject,
  mapLikeEntries,
  mapLikeValues,
  mapLikeToObject,
  mapLikeToFlatArray,
  getMapValue
};

export function toCompatObject(value: Record<string, unknown>): Record<string, unknown> {
  const descriptors: PropertyDescriptorMap = {};

  for (const [key, entryValue] of Object.entries(value)) {
    descriptors[key] = {
      value: entryValue,
      configurable: true,
      enumerable: true,
      writable: true
    };
  }

  return Object.defineProperties({}, descriptors);
}

function assignDocumentField(target: Record<string, unknown>, key: string, value: unknown): void {
  if (key === '$') {
    const json = (value as { toString?: () => string })?.toString?.() ?? value;
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

export function parseDocumentValue(value: unknown): Record<string, unknown> {
  const document: Record<string, unknown> = {};

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
    const normalized: Array<unknown> = [];
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
  id: unknown;
  value: Record<string, unknown>;
} {
  const row = mapLikeToObject(rawRow);

  const value: Record<string, unknown> = {};
  Object.assign(value, parseDocumentValue(getMapValue(row, ['values'])));
  Object.assign(value, parseDocumentValue(getMapValue(row, ['extra_attributes', 'extraAttributes'])));

  return {
    id: getMapValue(row, ['id', 'doc_id']),
    value: toCompatObject(value)
  };
}

export function parseAggregateResultRow(rawRow: unknown): Record<string, unknown> {
  const row = mapLikeToObject(rawRow);

  const result: Record<string, unknown> = {};
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
