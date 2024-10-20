import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import CLIENT_ID from './CLIENT_ID';
import { parseArgs } from './generic-transformers';

describe('CLIENT ID', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(CLIENT_ID),
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
