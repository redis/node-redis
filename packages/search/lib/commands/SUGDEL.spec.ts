import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SUGDEL from './SUGDEL';

describe('FT.SUGDEL', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      SUGDEL.transformArguments('key', 'string'),
      ['FT.SUGDEL', 'key', 'string']
    );
  });

  testUtils.testWithClient('client.ft.sugDel', async client => {
    assert.equal(
      await client.ft.sugDel('key', 'string'),
      0
    );
  }, GLOBAL.SERVERS.OPEN);
});
