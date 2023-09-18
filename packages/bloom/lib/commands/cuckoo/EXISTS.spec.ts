import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../../test-utils';
import EXISTS from './EXISTS';

describe('CF.EXISTS', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      EXISTS.transformArguments('key', 'item'),
      ['CF.EXISTS', 'key', 'item']
    );
  });

  testUtils.testWithClient('client.cf.exists', async client => {
    assert.equal(
      await client.cf.exists('key', 'item'),
      false
    );
  }, GLOBAL.SERVERS.OPEN);
});
