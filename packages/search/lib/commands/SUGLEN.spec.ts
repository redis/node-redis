import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SUGLEN from './SUGLEN';

describe('FT.SUGLEN', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      SUGLEN.transformArguments('key'),
      ['FT.SUGLEN', 'key']
    );
  });

  testUtils.testWithClient('client.ft.sugLen', async client => {
    assert.equal(
      await client.ft.sugLen('key'),
      0
    );
  }, GLOBAL.SERVERS.OPEN);
});
