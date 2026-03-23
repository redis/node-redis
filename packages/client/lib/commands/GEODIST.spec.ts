import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import GEODIST from './GEODIST';
import { parseArgs } from './generic-transformers';

describe('GEODIST', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(GEODIST, 'key', '1', '2'),
        ['GEODIST', 'key', '1', '2']
      );
    });

    it('with unit', () => {
      assert.deepEqual(
        parseArgs(GEODIST, 'key', '1', '2', 'm'),
        ['GEODIST', 'key', '1', '2', 'm']
      );
    });
  });

  // Regression: Number(uint8Array) is NaN; the transform must decode the bytes
  // first. A plain Uint8Array (not Buffer) is what the RESP decoder produces
  // when typeMapping[BLOB_STRING] = Uint8Array. Its .toString() returns
  // comma-separated byte values ("49,53,55,50,55,48,...") rather than the
  // semantic string "157270.0561", so Number() silently returns NaN.
  describe('transformReply Uint8Array', () => {
    it('Uint8Array distance string is parsed as a finite number, not NaN', () => {
      const rawReply = new Uint8Array(Buffer.from('157270.0561'));
      assert.equal(
        GEODIST.transformReply(rawReply as any),
        157270.0561
      );
    });
  });

  testUtils.testAll('geoDist null', async client => {
    assert.equal(
      await client.geoDist('key', '1', '2'),
      null
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });

  testUtils.testAll('geoDist with member', async client => {
    const [, dist] = await Promise.all([
      client.geoAdd('key', [{
        member: '1',
        longitude: 1,
        latitude: 1
      }, {
        member: '2',
        longitude: 2,
        latitude: 2
      }]),
      client.geoDist('key', '1', '2')
    ]);

    assert.equal(
      dist,
      157270.0561
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
