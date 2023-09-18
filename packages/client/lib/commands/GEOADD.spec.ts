import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import GEOADD from './GEOADD';

describe('GEOADD', () => {
  describe('transformArguments', () => {
    it('one member', () => {
      assert.deepEqual(
        GEOADD.transformArguments('key', {
          member: 'member',
          longitude: 1,
          latitude: 2
        }),
        ['GEOADD', 'key', '1', '2', 'member']
      );
    });

    it('multiple members', () => {
      assert.deepEqual(
        GEOADD.transformArguments('key', [{
          longitude: 1,
          latitude: 2,
          member: '3',
        }, {
          longitude: 4,
          latitude: 5,
          member: '6',
        }]),
        ['GEOADD', 'key', '1', '2', '3', '4', '5', '6']
      );
    });

    it('with condition', () => {
      assert.deepEqual(
        GEOADD.transformArguments('key', {
          longitude: 1,
          latitude: 2,
          member: 'member'
        }, {
          condition: 'NX'
        }),
        ['GEOADD', 'key', 'NX', '1', '2', 'member']
      );
    });

    it('with NX (backwards compatibility)', () => {
      assert.deepEqual(
        GEOADD.transformArguments('key', {
          longitude: 1,
          latitude: 2,
          member: 'member'
        }, {
          NX: true
        }),
        ['GEOADD', 'key', 'NX', '1', '2', 'member']
      );
    });

    it('with CH', () => {
      assert.deepEqual(
        GEOADD.transformArguments('key', {
          longitude: 1,
          latitude: 2,
          member: 'member'
        }, {
          CH: true
        }),
        ['GEOADD', 'key', 'CH', '1', '2', 'member']
      );
    });

    it('with condition, CH', () => {
      assert.deepEqual(
        GEOADD.transformArguments('key', {
          longitude: 1,
          latitude: 2,
          member: 'member'
        }, {
          condition: 'XX',
          CH: true
        }),
        ['GEOADD', 'key', 'XX', 'CH', '1', '2', 'member']
      );
    });
  });

  testUtils.testAll('geoAdd', async client => {
    assert.equal(
      await client.geoAdd('key', {
        member: 'member',
        longitude: 1,
        latitude: 2
      }),
      1
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
