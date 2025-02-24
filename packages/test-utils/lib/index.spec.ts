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



describe('Version Comparison', () => {
  it('should correctly compare versions', () => {
    const tests: [Array<number>, Array<number>, -1 | 0 | 1][] = [
      [[1, 0, 0], [1, 0, 0], 0],    
      [[2, 0, 0], [1, 9, 9], 1],   
      [[1, 9, 9], [2, 0, 0], -1],  
      [[1, 2, 3], [1, 2], 1],      
      [[1, 2], [1, 2, 3], -1],      
      [[1, 2, 0], [1, 2, 1], -1],   
      [[1], [1, 0, 0], 0],         
      [[2], [1, 9, 9], 1],          
    ];

    tests.forEach(([a, b, expected]) => {

      assert.equal(
        TestUtils.compareVersions(a, b),
        expected,
        `Failed comparing ${a.join('.')} with ${b.join('.')}: expected ${expected}`
      );
    });
  });

  it('should correctly compare versions', () => {
    const tests: [Array<number>, Array<number>, -1 | 0 | 1][] = [
      [[1, 0, 0], [1, 0, 0], 0],
      [[2, 0, 0], [1, 9, 9], 1],
      [[1, 9, 9], [2, 0, 0], -1],
      [[1, 2, 3], [1, 2], 1],
      [[1, 2], [1, 2, 3], -1],
      [[1, 2, 0], [1, 2, 1], -1],
      [[1], [1, 0, 0], 0],
      [[2], [1, 9, 9], 1],
    ];

    tests.forEach(([a, b, expected]) => {

      assert.equal(
        TestUtils.compareVersions(a, b),
        expected,
        `Failed comparing ${a.join('.')} with ${b.join('.')}: expected ${expected}`
      );
    });
  })
  it('isVersionInRange should work correctly', () => {
    const tests: [Array<number>, Array<number>, Array<number>, boolean][] = [
      [[7, 0, 0], [7, 0, 0], [7, 0, 0], true],
      [[7, 0, 1], [7, 0, 0], [7, 0, 2], true], 
      [[7, 0, 0], [7, 0, 1], [7, 0, 2], false],
      [[7, 0, 3], [7, 0, 1], [7, 0, 2], false],
      [[7], [6, 0, 0], [8, 0, 0], true],
      [[7, 1, 1], [7, 1, 0], [7, 1, 2], true],
      [[6, 0, 0], [7, 0, 0], [8, 0, 0], false],
      [[9, 0, 0], [7, 0, 0], [8, 0, 0], false]
    ];

    tests.forEach(([version, min, max, expected]) => {
      const testUtils = new TestUtils({ string: version.join('.'), numbers: version }, "test")
      assert.equal(
        testUtils.isVersionInRange(min, max),
        expected,
        `Failed checking if ${version.join('.')} is between ${min.join('.')} and ${max.join('.')}: expected ${expected}`
      );
    });
  })
});
