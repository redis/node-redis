import { strict as assert } from 'node:assert';
import calculateSlot from './calculate-slot';

describe('calculateSlot', () => {
  describe('empty hash tag handling', () => {
    // Redis treats an empty hash tag ("{}") as no tag at all: it hashes the
    // whole key and stops searching for a tag. The unpatched upstream
    // scanner instead falls through on an empty tag without clearing its
    // "in a tag" state, so it keeps scanning and latches onto the next "}"
    // in the key, hashing whatever sits between them instead of the whole
    // key. These values were measured against a live Redis 8.0.6 cluster
    // with `CLUSTER KEYSLOT` and confirm the vendored fix matches it.
    it('hashes the whole key when it contains only an empty tag', () => {
      assert.equal(calculateSlot('a{}b}c'), 2041);
      assert.equal(calculateSlot('{}a}b'), 5168);
      assert.equal(calculateSlot('x{}}y'), 2083);
      assert.equal(calculateSlot('{}{a}'), 13650);
    });

    it('does not resume tag scanning after an empty tag', () => {
      // Regression guard: an empty tag with no later '}' was already correct
      // before the fix, since the scanner falls off the end of the string.
      assert.equal(calculateSlot('user:{}:1'), 8272);
    });

    it('behaves the same for Buffer input as for string input', () => {
      assert.equal(calculateSlot(Buffer.from('a{}b}c')), 2041);
      assert.equal(calculateSlot(Buffer.from('x{}}y')), 2083);
    });
  });

  describe('regression guards for ordinary tags', () => {
    it('still hashes the contents of a normal, non-empty tag', () => {
      assert.equal(calculateSlot('a{b}c'), 3300);
    });

    it("still stops at the first '}' after the first '{'", () => {
      assert.equal(calculateSlot('a{b{c}d'), 15725);
    });

    it('still hashes the whole key when there are no braces', () => {
      assert.equal(calculateSlot('foo'), 12182);
    });
  });

  describe('generateMulti()', () => {
    it('returns the shared slot when all keys hash to the same slot', () => {
      // "a{}b}c" and "42703" both land on slot 2041 under the corrected
      // whole-key hashing behaviour.
      assert.equal(calculateSlot.generateMulti(['a{}b}c', '42703']), 2041);
    });

    it('returns -1 when keys hash to different slots', () => {
      assert.equal(calculateSlot.generateMulti(['x{}}y', 'z{}}w']), -1);
    });
  });

  describe('parity with upstream cluster-key-slot', () => {
    // Ported from cluster-key-slot's own test suite (test/hash.spec.js) at
    // https://github.com/invertase/cluster-key-slot/blob/master/test/hash.spec.js
    // to guard against regressions in the vendored implementation. None of
    // these keys trigger the empty-hash-tag bug, so every expected value is
    // unchanged from upstream.
    const tests: Array<[string | Buffer, number]> = [
      ['123465', 1492],
      ['foobar', 12325],
      ['abcdefghijklmnopqrstuvwxyz', 9132],
      ['gsdfhan$%^&*(sdgsdnhshcs', 15532],
      ['abc{foobar}', 12325],
      ['{foobar}', 12325],
      ['h8a9sd{foobar}}{asd}}', 12325],
      ['{foobar', 16235],
      ['foobar{}', 4435],
      ['{{foobar}', 16235],
      ['éêe', 13690],
      ['àâa', 3872],
      ['漢字', 14191],
      ['汉字', 16196],
      ['호텔', 4350],
      ['💀', 9284],
      ['𐀀', 11620], // surrogate pair
      ['{}foobar', 14573],
      [Buffer.from([0x7b, 0x7d, 0x2a, 0x2]), 3932],
      [Buffer.from([0x7b, 0x2a, 0x7d, 0x2]), 1320],
      [Buffer.from('汉字'), 16196]
    ];

    it('generates the same hash as upstream for each key', () => {
      for (const [key, expectedSlot] of tests) {
        assert.equal(calculateSlot(key), expectedSlot, String(key));
      }
    });

    it('generates the same multi-key hash as upstream', () => {
      const testsMulti = Array(8).fill('abcdefghijklmnopqrstuvwxyz');
      assert.equal(calculateSlot.generateMulti(testsMulti), 9132);
    });

    it("returns -1 for upstream's mixed-slot key set", () => {
      assert.equal(
        calculateSlot.generateMulti(tests.map(([key]) => key)),
        -1
      );
    });
  });
});
