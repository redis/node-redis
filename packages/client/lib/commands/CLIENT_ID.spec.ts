import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import CLIENT_ID from './CLIENT_ID';

describe('CLIENT ID', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      CLIENT_ID.transformArguments(),
      ['CLIENT', 'ID']
    );
  });

  testUtils.testWithClient('client.clientId', async client => {
    assert.equal(
      typeof (await client.clientId()),
      'number'
    );
  }, GLOBAL.SERVERS.OPEN);
});
