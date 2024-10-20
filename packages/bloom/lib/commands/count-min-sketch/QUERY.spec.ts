import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../../test-utils';
import QUERY from './QUERY';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('CMS.QUERY', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(QUERY, 'key', 'item'),
      ['CMS.QUERY', 'key', 'item']
    );
  });

  testUtils.testWithClient('client.cms.query', async client => {
    const [, reply] = await Promise.all([
      client.cms.initByDim('key', 1000, 5),
      client.cms.query('key', 'item')
    ]);

    assert.deepEqual(reply, [0]);
  }, GLOBAL.SERVERS.OPEN);
});
