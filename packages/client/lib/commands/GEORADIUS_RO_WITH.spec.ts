import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import GEORADIUS_RO_WITH from './GEORADIUS_RO_WITH';
import { GEO_REPLY_WITH } from './GEOSEARCH_WITH';
import { CommandArguments } from '../RESP/types';
import { parseArgs } from './generic-transformers';

describe('GEORADIUS_RO WITH', () => {
  it('transformArguments', () => {
    const expectedReply: CommandArguments = ['GEORADIUS_RO', 'key', '1', '2', '3', 'm', 'WITHDIST'];
    expectedReply.preserve = ['WITHDIST'];

    assert.deepEqual(
      parseArgs(GEORADIUS_RO_WITH, 'key', {
        longitude: 1,
        latitude: 2
      }, 3, 'm', [GEO_REPLY_WITH.DISTANCE]),
      expectedReply
    );
  });

  it('transformReply should parse RESP2 floating-point strings', () => {
    const reply = GEORADIUS_RO_WITH.transformReply([
      ['member', '0.5', 1, ['1.23', '4.56']]
    ] as any, [
      GEO_REPLY_WITH.DISTANCE,
      GEO_REPLY_WITH.HASH,
      GEO_REPLY_WITH.COORDINATES
    ]);

    assert.equal(reply.length, 1);
    assert.equal(reply[0].member, 'member');
    assert.equal(reply[0].distance, 0.5);
    assert.equal(reply[0].hash, 1);
    assert.equal(reply[0].coordinates!.longitude, 1.23);
    assert.equal(reply[0].coordinates!.latitude, 4.56);
  });

  testUtils.testAll('geoRadiusRoWith', async client => {
    const [, reply] = await Promise.all([
      client.geoAdd('key', {
        member: 'member',
        longitude: 1,
        latitude: 2
      }),
      client.geoRadiusRoWith('key', {
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
    assert.equal(typeof reply[0].distance, 'number');
    assert.equal(typeof reply[0].hash, 'number');
    assert.equal(typeof reply[0].coordinates!.longitude, 'number');
    assert.equal(typeof reply[0].coordinates!.latitude, 'number');
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
