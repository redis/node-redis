import { strict as assert } from 'node:assert';
import {
  isPlainObject,
  keyToString,
  mapLikeEntries,
  mapLikeValues,
  mapLikeToObject,
  mapLikeToFlatArray,
  getMapValue
} from './reply-utils';

describe('reply-utils', () => {
  describe('isPlainObject', () => {
    it('accepts plain object literals', () => {
      assert.equal(isPlainObject({}), true);
      assert.equal(isPlainObject({ a: 1 }), true);
    });

    it('accepts Object.create(null)', () => {
      assert.equal(isPlainObject(Object.create(null)), true);
    });

    it('rejects arrays, Maps, Buffers, Dates, null, primitives', () => {
      assert.equal(isPlainObject([]), false);
      assert.equal(isPlainObject(new Map()), false);
      assert.equal(isPlainObject(Buffer.from('x')), false);
      assert.equal(isPlainObject(new Uint8Array(1)), false);
      assert.equal(isPlainObject(new Date()), false);
      assert.equal(isPlainObject(null), false);
      assert.equal(isPlainObject(undefined), false);
      assert.equal(isPlainObject('s'), false);
      assert.equal(isPlainObject(1), false);
    });
  });

  describe('keyToString', () => {
    it('coerces null and undefined to empty string', () => {
      assert.equal(keyToString(null), '');
      assert.equal(keyToString(undefined), '');
    });

    it('stringifies Buffers, numbers, and strings', () => {
      assert.equal(keyToString(Buffer.from('foo')), 'foo');
      assert.equal(keyToString(42), '42');
      assert.equal(keyToString('bar'), 'bar');
    });
  });

  describe('mapLikeEntries', () => {
    describe('empty inputs', () => {
      it('returns [] for an empty Map', () => {
        assert.deepEqual(mapLikeEntries(new Map()), []);
      });

      it('returns [] for an empty plain object', () => {
        assert.deepEqual(mapLikeEntries({}), []);
      });

      it('returns [] for an empty array', () => {
        assert.deepEqual(mapLikeEntries([]), []);
      });

      it('returns [] for non-map-like inputs', () => {
        assert.deepEqual(mapLikeEntries(null), []);
        assert.deepEqual(mapLikeEntries(undefined), []);
        assert.deepEqual(mapLikeEntries(42), []);
        assert.deepEqual(mapLikeEntries('foo'), []);
      });
    });

    describe('single-key inputs', () => {
      it('reads a single entry from a Map', () => {
        assert.deepEqual(
          mapLikeEntries(new Map([['k', 'v']])),
          [['k', 'v']]
        );
      });

      it('reads a single entry from a plain object', () => {
        assert.deepEqual(mapLikeEntries({ k: 'v' }), [['k', 'v']]);
      });

      it('reads a single entry from a flat key/value array', () => {
        assert.deepEqual(mapLikeEntries(['k', 'v']), [['k', 'v']]);
      });

      it('reads a single entry from a tuple array', () => {
        assert.deepEqual(mapLikeEntries([['k', 'v']]), [['k', 'v']]);
      });

      it('stringifies non-string keys consistently across shapes', () => {
        const m = new Map<unknown, unknown>([[Buffer.from('k'), 1]]);
        assert.deepEqual(mapLikeEntries(m), [['k', 1]]);
        assert.deepEqual(mapLikeEntries([Buffer.from('k'), 1]), [['k', 1]]);
        assert.deepEqual(mapLikeEntries([[Buffer.from('k'), 1]]), [['k', 1]]);
      });

      it('coerces null/undefined keys to empty string instead of throwing', () => {
        assert.deepEqual(mapLikeEntries([null, 1]), [['', 1]]);
        assert.deepEqual(mapLikeEntries([[null, 1]]), [['', 1]]);
        assert.deepEqual(mapLikeEntries(new Map([[null, 1]])), [['', 1]]);
      });
    });

    describe('multi-entry shapes', () => {
      it('reads a Map with multiple entries', () => {
        const result = mapLikeEntries(new Map([['a', 1], ['b', 2]]));
        assert.deepEqual(result, [['a', 1], ['b', 2]]);
      });

      it('reads a plain object with multiple entries', () => {
        assert.deepEqual(
          mapLikeEntries({ a: 1, b: 2 }),
          [['a', 1], ['b', 2]]
        );
      });

      it('reads a flat key/value array with multiple entries', () => {
        assert.deepEqual(
          mapLikeEntries(['a', 1, 'b', 2]),
          [['a', 1], ['b', 2]]
        );
      });

      it('reads a tuple array with multiple entries', () => {
        assert.deepEqual(
          mapLikeEntries([['a', 1], ['b', 2]]),
          [['a', 1], ['b', 2]]
        );
      });

      it('drops a trailing unpaired element in a flat array', () => {
        assert.deepEqual(
          mapLikeEntries(['a', 1, 'b']),
          [['a', 1]]
        );
      });

      it('keeps only the first two slots of tuples longer than two', () => {
        assert.deepEqual(
          mapLikeEntries([['a', 1, 'extra'], ['b', 2, 'extra']]),
          [['a', 1], ['b', 2]]
        );
      });
    });

    describe('single-element array unwrapping', () => {
      it('unwraps [Map]', () => {
        assert.deepEqual(
          mapLikeEntries([new Map([['k', 'v']])]),
          [['k', 'v']]
        );
      });

      it('unwraps [plainObject]', () => {
        assert.deepEqual(mapLikeEntries([{ k: 'v' }]), [['k', 'v']]);
      });

      it('unwraps a tuple-array wrapped in an array', () => {
        assert.deepEqual(
          mapLikeEntries([[['k', 'v']]]),
          [['k', 'v']]
        );
      });

      it('does NOT unwrap [primitive] — falls back to flat-array branch', () => {
        // ['only'] is a 1-element flat array: loop runs 0 times → []
        assert.deepEqual(mapLikeEntries(['only']), []);
      });
    });

    describe('mixed / heuristic edges', () => {
      it('a flat array containing only 2+ length arrays is read as tuple list, not flat', () => {
        // value.every(item => Array.isArray && length >= 2) — tuple branch wins
        const result = mapLikeEntries([['a', 1], ['b', 2]]);
        assert.deepEqual(result, [['a', 1], ['b', 2]]);
      });

      it('a mixed array (some tuples, some scalars) falls back to flat key/value pairing', () => {
        // every() fails because 'b' is not an array → flat branch
        assert.deepEqual(
          mapLikeEntries([['a', 1], 'b', 2]),
          [['a,1', 'b'] /* Array#toString joins with comma */]
        );
      });

      it('tuple values can themselves be Maps/objects (passthrough, no recursion)', () => {
        const inner = new Map([['x', 1]]);
        assert.deepEqual(
          mapLikeEntries([['outer', inner]]),
          [['outer', inner]]
        );
      });
    });
  });

  describe('mapLikeValues', () => {
    it('returns [] for empty inputs', () => {
      assert.deepEqual(mapLikeValues(new Map()), []);
      assert.deepEqual(mapLikeValues({}), []);
      assert.deepEqual(mapLikeValues([]), []);
    });

    it('returns [] for non-map-like inputs', () => {
      assert.deepEqual(mapLikeValues(null), []);
      assert.deepEqual(mapLikeValues(undefined), []);
      assert.deepEqual(mapLikeValues(42), []);
    });

    it('returns array contents as-is (does NOT pair key/value)', () => {
      // Note: mapLikeValues differs from mapLikeEntries — it does not flatten pairs.
      assert.deepEqual(mapLikeValues(['a', 1, 'b', 2]), ['a', 1, 'b', 2]);
    });

    it('returns Map values in insertion order', () => {
      assert.deepEqual(
        mapLikeValues(new Map([['a', 1], ['b', 2]])),
        [1, 2]
      );
    });

    it('returns plain-object values', () => {
      assert.deepEqual(mapLikeValues({ a: 1, b: 2 }), [1, 2]);
    });
  });

  describe('mapLikeToObject', () => {
    it('returns {} for empty inputs', () => {
      assert.deepEqual(mapLikeToObject(new Map()), {});
      assert.deepEqual(mapLikeToObject({}), {});
      assert.deepEqual(mapLikeToObject([]), {});
    });

    it('normalizes all four shapes to the same object', () => {
      const expected = { a: 1, b: 2 };
      assert.deepEqual(mapLikeToObject(new Map([['a', 1], ['b', 2]])), expected);
      assert.deepEqual(mapLikeToObject({ a: 1, b: 2 }), expected);
      assert.deepEqual(mapLikeToObject(['a', 1, 'b', 2]), expected);
      assert.deepEqual(mapLikeToObject([['a', 1], ['b', 2]]), expected);
    });
  });

  describe('mapLikeToFlatArray', () => {
    it('returns [] for empty inputs', () => {
      assert.deepEqual(mapLikeToFlatArray(new Map()), []);
      assert.deepEqual(mapLikeToFlatArray({}), []);
      assert.deepEqual(mapLikeToFlatArray([]), []);
    });

    it('normalizes all four shapes to the same flat key/value list', () => {
      const expected = ['a', 1, 'b', 2];
      assert.deepEqual(mapLikeToFlatArray(new Map([['a', 1], ['b', 2]])), expected);
      assert.deepEqual(mapLikeToFlatArray({ a: 1, b: 2 }), expected);
      assert.deepEqual(mapLikeToFlatArray(['a', 1, 'b', 2]), expected);
      assert.deepEqual(mapLikeToFlatArray([['a', 1], ['b', 2]]), expected);
    });
  });

  describe('getMapValue', () => {
    it('returns undefined for empty inputs', () => {
      assert.equal(getMapValue({}, ['a']), undefined);
      assert.equal(getMapValue(new Map(), ['a']), undefined);
      assert.equal(getMapValue([], ['a']), undefined);
    });

    it('returns undefined when no requested key matches', () => {
      assert.equal(getMapValue({ a: 1 }, ['b', 'c']), undefined);
    });

    it('prefers exact-case match over case-insensitive match', () => {
      // Both 'Total' and 'total' exist; exact 'total' wins.
      assert.equal(getMapValue({ Total: 1, total: 2 }, ['total']), 2);
    });

    it('falls back to case-insensitive match', () => {
      assert.equal(getMapValue({ Total: 1 }, ['total']), 1);
    });

    it('returns the value of the first key in the lookup list that matches', () => {
      assert.equal(getMapValue({ a: 1, b: 2 }, ['b', 'a']), 2);
    });

    it('works across all four shapes', () => {
      assert.equal(getMapValue(new Map([['a', 1]]), ['a']), 1);
      assert.equal(getMapValue(['a', 1], ['a']), 1);
      assert.equal(getMapValue([['a', 1]], ['a']), 1);
    });
  });
});
