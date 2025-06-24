import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import VLINKS from './VLINKS';
import { BasicCommandParser } from '../client/parser';

describe('VLINKS', () => {
  it('parseCommand', () => {
    const parser = new BasicCommandParser();
    VLINKS.parseCommand(parser, 'key', 'element');
    assert.deepEqual(
      parser.redisArgs,
      ['VLINKS', 'key', 'element']
    );
  });

  testUtils.testAll('vLinks', async client => {
    await client.vAdd('key', [1.0, 2.0, 3.0], 'element1');
    await client.vAdd('key', [1.1, 2.1, 3.1], 'element2');

    const result = await client.vLinks('key', 'element1');
    assert.ok(Array.isArray(result));
    assert.ok(result.length)
  }, {
    client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 0] },
    cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 0] }
  });

  testUtils.testWithClient('vLinks with RESP3', async client => {
    await client.vAdd('resp3-key', [1.0, 2.0, 3.0], 'element1');
    await client.vAdd('resp3-key', [1.1, 2.1, 3.1], 'element2');

    const result = await client.vLinks('resp3-key', 'element1');
    assert.ok(Array.isArray(result));
    assert.ok(result.length)
  }, {
    ...GLOBAL.SERVERS.OPEN,
    clientOptions: {
      RESP: 3
    },
    minimumDockerVersion: [8, 0]
  });
});
