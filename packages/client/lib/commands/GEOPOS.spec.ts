import { strict as assert, fail } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import GEOPOS from './GEOPOS';
import { parseArgs } from './generic-transformers';

describe('GEOPOS', () => {
  describe('transformArguments', () => {
    it('single member', () => {
      assert.deepEqual(
        parseArgs(GEOPOS, 'key', 'member'),
        ['GEOPOS', 'key', 'member']
      );
    });

    it('multiple members', () => {
      assert.deepEqual(
        parseArgs(GEOPOS, 'key', ['1', '2']),
        ['GEOPOS', 'key', '1', '2']
      );
    });
  });

  testUtils.testAll('geoPos null', async client => {
    assert.deepEqual(
      await client.geoPos('key', 'member'),
      [null]
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });

  testUtils.testAll('geoPos with member', async client => {
    const coordinates = {
      longitude: '-122.06429868936538696',
      latitude: '37.37749628831998194'
    };

    await client.geoAdd('key', {
      member: 'member',
      ...coordinates
    });

    const result = await client.geoPos('key', 'member');

    /**
     *  - Redis < 8: Returns coordinates with 14 decimal places (e.g., "-122.06429868936539")
     *  - Redis 8+:  Returns coordinates with 17 decimal places (e.g., "-122.06429868936538696")
     *
     */
    const PRECISION = 13; // Number of decimal places to compare

    if (result && result.length === 1 && result[0] != null) {
      const { longitude, latitude } = result[0];

      assert.ok(
        compareWithPrecision(longitude, coordinates.longitude, PRECISION),
        `Longitude mismatch: ${longitude} vs ${coordinates.longitude}`
      );
      assert.ok(
        compareWithPrecision(latitude, coordinates.latitude, PRECISION),
        `Latitude mismatch: ${latitude} vs ${coordinates.latitude}`
      );

    } else {
      assert.fail('Expected a valid result');
    }



  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});

describe('compareWithPrecision', () => {
  it('should match exact same numbers', () => {
    assert.strictEqual(
      compareWithPrecision('123.456789', '123.456789', 6),
      true
    );
  });

  it('should match when actual has more precision than needed', () => {
    assert.strictEqual(
      compareWithPrecision('123.456789123456', '123.456789', 6),
      true
    );
  });

  it('should match when expected has more precision than needed', () => {
    assert.strictEqual(
      compareWithPrecision('123.456789', '123.456789123456', 6),
      true
    );
  });

  it('should fail when decimals differ within precision', () => {
    assert.strictEqual(
      compareWithPrecision('123.456689', '123.456789', 6),
      false
    );
  });

  it('should handle negative numbers', () => {
    assert.strictEqual(
      compareWithPrecision('-122.06429868936538', '-122.06429868936539', 13),
      true
    );
  });

  it('should fail when integer parts differ', () => {
    assert.strictEqual(
      compareWithPrecision('124.456789', '123.456789', 6),
      false
    );
  });

  it('should handle zero decimal places', () => {
    assert.strictEqual(
      compareWithPrecision('123.456789', '123.456789', 0),
      true
    );
  });

  it('should handle numbers without decimal points', () => {
    assert.strictEqual(
      compareWithPrecision('123', '123', 6),
      true
    );
  });

  it('should handle one number without decimal point', () => {
    assert.strictEqual(
      compareWithPrecision('123', '123.000', 3),
      true
    );
  });

  it('should match Redis coordinates with different precision', () => {
    assert.strictEqual(
      compareWithPrecision(
        '-122.06429868936538696',
        '-122.06429868936539',
        13
      ),
      true
    );
  });

  it('should match Redis latitude with different precision', () => {
    assert.strictEqual(
      compareWithPrecision(
        '37.37749628831998194',
        '37.37749628831998',
        14
      ),
      true
    );
  });
});

export const compareWithPrecision = (actual: string, expected: string, decimals: number): boolean => {
  return Math.abs(Number(actual) - Number(expected)) < Math.pow(10, -decimals);
};
