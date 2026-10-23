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

  it('transforms a RESP2 reply', () => {
    assert.deepEqual(
      VEMB.transformReply[2](['1.0', '2.0', '3.0']),
      [1.0, 2.0, 3.0]
    );
  });

  it('returns null for a nil RESP2 reply', () => {
    assert.equal(
      VEMB.transformReply[2](null),
      null
    );
  });

  it('returns null for a nil RESP3 reply', () => {
    const transform = VEMB.transformReply[3] as unknown as ((reply: unknown) => unknown) | undefined;
    assert.equal(
      typeof transform === 'function' ? transform(null) : null,
      null
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

});
