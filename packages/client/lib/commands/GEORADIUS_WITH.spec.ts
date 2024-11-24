import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import GEORADIUS_WITH from './GEORADIUS_WITH';
import { GEO_REPLY_WITH } from './GEOSEARCH_WITH';
import { CommandArguments } from '../RESP/types';
import { parseArgs } from './generic-transformers';

describe('GEORADIUS WITH', () => {
  it('transformArguments', () => {
    const expectedReply: CommandArguments = ['GEORADIUS', 'key', '1', '2', '3', 'm', 'WITHDIST'];
    expectedReply.preserve = ['WITHDIST'];

    assert.deepEqual(
      parseArgs(GEORADIUS_WITH, 'key', {
        longitude: 1,
        latitude: 2
      }, 3, 'm', [GEO_REPLY_WITH.DISTANCE]),
      expectedReply
    );
  });

  testUtils.testAll('geoRadiusWith', async client => {
    const [, reply] = await Promise.all([
      client.geoAdd('key', {
        member: 'member',
        longitude: 1,
        latitude: 2
      }),
      client.geoRadiusWith('key', {
        longitude: 1,
        latitude: 2
      }, 1, 'm', [
        GEO_REPLY_WITH.HASH,
        GEO_REPLY_WITH.DISTANCE,
        GEO_REPLY_WITH.COORDINATES
      ])
    ]);

    assert.equal(reply.length, 1);
    assert.equal(reply[0].member, 'member');
    assert.equal(typeof reply[0].distance, 'string');
    assert.equal(typeof reply[0].hash, 'number');
    assert.equal(typeof reply[0].coordinates?.longitude, 'string');
    assert.equal(typeof reply[0].coordinates?.latitude, 'string');
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
