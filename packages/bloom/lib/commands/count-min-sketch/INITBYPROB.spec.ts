import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../../test-utils';
import INITBYPROB from './INITBYPROB';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('CMS.INITBYPROB', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(INITBYPROB, 'key', 0.001, 0.01),
      ['CMS.INITBYPROB', 'key', '0.001', '0.01']
    );
  });

  testUtils.testWithClient('client.cms.initByProb', async client => {
    assert.equal(
      await client.cms.initByProb('key', 0.001, 0.01),
      'OK'
    );
  }, GLOBAL.SERVERS.OPEN);
});
