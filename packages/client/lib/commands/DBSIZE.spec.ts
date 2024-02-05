import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import DBSIZE from './DBSIZE';

describe('DBSIZE', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      DBSIZE.transformArguments(),
      ['DBSIZE']
    );
  });

  testUtils.testWithClient('client.dbSize', async client => {
    assert.equal(
      await client.dbSize(),
      0
    );
  }, GLOBAL.SERVERS.OPEN);
});
