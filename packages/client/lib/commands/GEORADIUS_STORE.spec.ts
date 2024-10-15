import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import GEORADIUS_STORE from './GEORADIUS_STORE';
import { parseArgs } from './generic-transformers';

describe('GEORADIUS STORE', () => {
  describe('transformArguments', () => {
    it('STORE', () => {
      assert.deepEqual(
        parseArgs(GEORADIUS_STORE, 'key', {
          longitude: 1,
          latitude: 2
        }, 3, 'm', 'destination'),
        ['GEORADIUS', 'key', '1', '2', '3', 'm', 'STORE', 'destination']
      );
    });

    it('STOREDIST', () => {
      assert.deepEqual(
        parseArgs(GEORADIUS_STORE, 'key', {
          longitude: 1,
          latitude: 2 
        }, 3, 'm', 'destination', {
          STOREDIST: true
        }),
        ['GEORADIUS', 'key', '1', '2', '3', 'm', 'STOREDIST', 'destination']
      );
    });
  });

  testUtils.testAll('geoRadiusStore', async client => {
    const [, reply] = await Promise.all([
      client.geoAdd('{tag}source', {
        longitude: 1,
        latitude: 2,
        member: 'member'
      }),
      client.geoRadiusStore('{tag}source', {
        longitude: 1,
        latitude: 2
      }, 1, 'm', '{tag}destination')
    ]);

    assert.equal(reply, 1);
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
