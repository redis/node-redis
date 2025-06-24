import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import VEMB from './VEMB';
import { BasicCommandParser } from '../client/parser';

describe('VEMB', () => {
  it('parseCommand', () => {
    const parser = new BasicCommandParser();
    VEMB.parseCommand(parser, 'key', 'element');
    assert.deepEqual(
      parser.redisArgs,
      ['VEMB', 'key', 'element']
    );
  });

  testUtils.testAll('vEmb', async client => {
    await client.vAdd('key', [1.0, 2.0, 3.0], 'element');

    const result = await client.vEmb('key', 'element');
    assert.ok(Array.isArray(result));
    assert.equal(result.length, 3);
    assert.equal(typeof result[0], 'number');
  }, {
    client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 0] },
    cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 0] }
  });

  testUtils.testWithClient('vEmb with RESP3', async client => {
    await client.vAdd('resp3-key', [1.5, 2.5, 3.5, 4.5], 'resp3-element');

    const result = await client.vEmb('resp3-key', 'resp3-element');
    assert.ok(Array.isArray(result));
    assert.equal(result.length, 4);
    assert.equal(typeof result[0], 'number');
  }, {
    ...GLOBAL.SERVERS.OPEN,
    clientOptions: {
      RESP: 3
    },
    minimumDockerVersion: [8, 0]
  });
});
