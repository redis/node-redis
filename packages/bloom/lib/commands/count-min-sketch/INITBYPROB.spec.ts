import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../../test-utils';
import INITBYPROB from './INITBYPROB';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('CMS.INITBYPROB', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(INITBYPROB, 'key', 0.001, 0.01),
        ['CMS.INITBYPROB', 'key', '0.001', '0.01']
      );
    });

    it('with CELL_SIZE', () => {
      assert.deepEqual(
        parseArgs(INITBYPROB, 'key', 0.001, 0.01, { CELL_SIZE: 4 }),
        ['CMS.INITBYPROB', 'key', '0.001', '0.01', 'CELL_SIZE', '4']
      );
    });
  });

  testUtils.testWithClient('client.cms.initByProb', async client => {
    assert.equal(
      await client.cms.initByProb('key', 0.001, 0.01),
      'OK'
    );
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClient('client.cms.initByProb with CELL_SIZE', async client => {
    assert.equal(
      await client.cms.initByProb('key', 0.001, 0.01, { CELL_SIZE: 4 }),
      'OK'
    );
  }, {
    ...GLOBAL.SERVERS.OPEN,
    minimumDockerVersion: [8, 12]
  });
});
