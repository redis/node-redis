import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../../test-utils';
import INFO from './INFO';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('TOPK INFO', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(INFO, 'key'),
      ['TOPK.INFO', 'key']
    );
  });

  testUtils.testWithClient('client.topK.info', async client => {
    const k = 3,
      [, reply] = await Promise.all([
        client.topK.reserve('key', 3),
        client.topK.info('key')
      ]);

    assert.equal(typeof reply, 'object');
    assert.equal(reply.k, k);
    assert.equal(typeof reply.width, 'number');
    assert.equal(typeof reply.depth, 'number');
    assert.equal(typeof reply.decay, 'number');
  }, GLOBAL.SERVERS.OPEN);
});
