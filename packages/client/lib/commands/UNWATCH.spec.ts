import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import UNWATCH from './UNWATCH';

describe('UNWATCH', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      UNWATCH.transformArguments(),
      ['UNWATCH']
    );
  });

  testUtils.testWithClient('client.unwatch', async client => {
    assert.equal(
      await client.unwatch(),
      'OK'
    );
  }, GLOBAL.SERVERS.OPEN);
});
