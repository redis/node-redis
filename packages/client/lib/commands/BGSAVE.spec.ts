import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import BGSAVE from './BGSAVE';
import { parseArgs } from './generic-transformers';

describe('BGSAVE', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(BGSAVE),
        ['BGSAVE']
      );
    });

    it('with SCHEDULE', () => {
      assert.deepEqual(
        parseArgs(BGSAVE, {
          SCHEDULE: true
        }),
        ['BGSAVE', 'SCHEDULE']
      );
    });
  });

  testUtils.testWithClient('client.bgSave', async client => {
    assert.equal(
      typeof await client.bgSave({
        SCHEDULE: true // using `SCHEDULE` to make sure it won't throw an error
      }),
      'string'
    );
  }, GLOBAL.SERVERS.OPEN);
});
