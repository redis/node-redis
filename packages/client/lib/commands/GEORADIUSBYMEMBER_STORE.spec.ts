import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import GEORADIUSBYMEMBER_STORE from './GEORADIUSBYMEMBER_STORE';
import { parseArgs } from './generic-transformers';

describe('GEORADIUSBYMEMBER STORE', () => {
  describe('transformArguments', () => {
    it('STORE', () => {
      assert.deepEqual(
        parseArgs(GEORADIUSBYMEMBER_STORE, 'key', 'member', 3, 'm', 'destination'),
        ['GEORADIUSBYMEMBER', 'key', 'member', '3', 'm', 'STORE', 'destination']
      );
    });

    it('STOREDIST', () => {
      assert.deepEqual(
        parseArgs(GEORADIUSBYMEMBER_STORE, 'key', 'member', 3, 'm', 'destination', {
          STOREDIST: true
        }),
        ['GEORADIUSBYMEMBER', 'key', 'member', '3', 'm', 'STOREDIST', 'destination']
      );
    });
  });

  testUtils.testAll('geoRadiusByMemberStore', async client => {
    const [, reply] = await Promise.all([
      client.geoAdd('{tag}source', {
        longitude: 1,
        latitude: 2,
        member: 'member'
      }),
      client.geoRadiusByMemberStore('{tag}source', 'member', 3, 'm', '{tag}destination')
    ]);

    assert.equal(reply, 1);
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
