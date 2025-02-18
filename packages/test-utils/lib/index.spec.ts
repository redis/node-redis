import { strict as assert } from 'node:assert';
import TestUtils from './index';

describe('TestUtils', () => {
  describe('parseVersionNumber', () => {
    it('should handle special versions', () => {
      assert.deepStrictEqual(TestUtils.parseVersionNumber('latest'), [Infinity]);
      assert.deepStrictEqual(TestUtils.parseVersionNumber('edge'), [Infinity]);
    });

    it('should parse simple version numbers', () => {
      assert.deepStrictEqual(TestUtils.parseVersionNumber('7.4.0'), [7, 4, 0]);
    });

    it('should handle versions with multiple dashes and prefixes', () => {
      assert.deepStrictEqual(TestUtils.parseVersionNumber('rs-7.4.0-v2'), [7, 4, 0]);
      assert.deepStrictEqual(TestUtils.parseVersionNumber('rs-7.4.0'), [7, 4, 0]);
      assert.deepStrictEqual(TestUtils.parseVersionNumber('7.4.0-v2'), [7, 4, 0]);
    });

    it('should handle various version number formats', () => {
      assert.deepStrictEqual(TestUtils.parseVersionNumber('10.5'), [10, 5]);
      assert.deepStrictEqual(TestUtils.parseVersionNumber('8.0.0'), [8, 0, 0]);
      assert.deepStrictEqual(TestUtils.parseVersionNumber('rs-6.2.4-v1'), [6, 2, 4]);
    });

    it('should throw TypeError for invalid version strings', () => {
      ['', 'invalid', 'rs-', 'v2', 'rs-invalid-v2'].forEach(version => {
        assert.throws(
          () => TestUtils.parseVersionNumber(version),
          TypeError,
          `Expected TypeError for version string: ${version}`
        );
      });
    });
  });
});