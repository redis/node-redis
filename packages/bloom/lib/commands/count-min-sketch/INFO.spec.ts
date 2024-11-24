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

    const expected = Object.create(null);
    expected['width'] = width;
    expected['depth'] = depth;
    expected['count'] = 0;

    assert.deepEqual(reply, expected);
  }, GLOBAL.SERVERS.OPEN);
});
