import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../../test-utils';
import INITBYDIM from './INITBYDIM';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('CMS.INITBYDIM', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(INITBYDIM, 'key', 1000, 5),
        ['CMS.INITBYDIM', 'key', '1000', '5']
      );
    });

    it('with CELL_SIZE', () => {
      assert.deepEqual(
        parseArgs(INITBYDIM, 'key', 1000, 5, 4),
        ['CMS.INITBYDIM', 'key', '1000', '5', 'CELL_SIZE', '4']
      );
    });
  });

  testUtils.testWithClient('client.cms.initByDim', async client => {
    assert.equal(
      await client.cms.initByDim('key', 1000, 5),
      'OK'
    );
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClient('client.cms.initByDim with CELL_SIZE', async client => {
    assert.equal(
      await client.cms.initByDim('key', 1000, 5, 4),
      'OK'
    );
  }, {
    ...GLOBAL.SERVERS.OPEN,
    minimumDockerVersion: [8, 12]
  });
});
