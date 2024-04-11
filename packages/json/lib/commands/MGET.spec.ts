import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import MGET from './MGET';

describe('JSON.MGET', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      MGET.transformArguments(['1', '2'], '$'),
      ['JSON.MGET', '1', '2', '$']
    );
  });

  testUtils.testWithClient('client.json.mGet', async client => {
    assert.deepEqual(
      await client.json.mGet(['1', '2'], '$'),
      [null, null]
    );
  }, GLOBAL.SERVERS.OPEN);
});
