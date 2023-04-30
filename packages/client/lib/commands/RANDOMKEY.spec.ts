import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import RANDOMKEY from './RANDOMKEY';

describe('RANDOMKEY', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      RANDOMKEY.transformArguments(),
      ['RANDOMKEY']
    );
  });

  testUtils.testWithClient('client.randomKey', async client => {
    assert.equal(
      await client.randomKey(),
      null
    );
  }, GLOBAL.SERVERS.OPEN);
});
