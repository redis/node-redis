import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../../test-utils';
import INFO from './INFO';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('CMS.INFO', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(INFO, 'key'),
      ['CMS.INFO', 'key']
    );
  });

  testUtils.testWithClient('client.cms.info', async client => {
    const width = 1000,
      depth = 5,
      [, reply] = await Promise.all([
        client.cms.initByDim('key', width, depth),
        client.cms.info('key')
      ]);

    assert.equal(reply.width, width);
    assert.equal(reply.depth, depth);
    assert.equal(reply.count, 0);
    // Newer server builds also report the counter byte width (uint32 => 4);
    // older builds omit the field entirely.
    if ('cell size' in reply) {
      assert.equal(reply['cell size'], 4);
    }
  }, GLOBAL.SERVERS.OPEN);
});
