import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import GEOSEARCH_WITH, { GEO_REPLY_WITH } from './GEOSEARCH_WITH';
import { CommandArguments } from '../RESP/types';
import { parseArgs } from './generic-transformers';

describe('GEOSEARCH WITH', () => {
  testUtils.isVersionGreaterThanHook([6, 2]);

  it('transformArguments', () => {
    const expectedReply: CommandArguments = ['GEOSEARCH', 'key', 'FROMMEMBER', 'member', 'BYRADIUS', '1', 'm', 'WITHDIST'];
    expectedReply.preserve = ['WITHDIST'];

    assert.deepEqual(
      parseArgs(GEOSEARCH_WITH, 'key', 'member', {
        radius: 1,
        unit: 'm'
      }, [GEO_REPLY_WITH.DISTANCE]),
      expectedReply
    );
  });

  testUtils.testAll('.geoSearchWith', async client => {
    const [ , reply ] = await Promise.all([
      client.geoAdd('key', {
        member: 'member',
        longitude: 1,
        latitude: 2
      }),
      client.geoSearchWith('key', 'member', {
        radius: 1,
        unit: 'm'
      }, [
        GEO_REPLY_WITH.HASH,
        GEO_REPLY_WITH.DISTANCE,
        GEO_REPLY_WITH.COORDINATES
      ])
    ]);

    assert.equal(reply.length, 1);
    assert.equal(reply[0].member, 'member');
    assert.equal(typeof reply[0].distance, 'string');
    assert.equal(typeof reply[0].hash, 'number');
    assert.equal(typeof reply[0].coordinates!.longitude, 'string');
    assert.equal(typeof reply[0].coordinates!.latitude, 'string');
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
