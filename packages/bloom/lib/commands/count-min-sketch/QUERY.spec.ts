import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../../test-utils';
import QUERY from './QUERY';

describe('CMS.QUERY', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      QUERY.transformArguments('key', 'item'),
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
