import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import CLIENT_GETNAME from './CLIENT_GETNAME';
import { parseArgs } from './generic-transformers';

describe('CLIENT GETNAME', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(CLIENT_GETNAME),
      ['CLIENT', 'GETNAME']
    );
  });
  
  testUtils.testWithClient('client.clientGetName', async client => {
    assert.equal(
      await client.clientGetName(),
      null
    );
  }, GLOBAL.SERVERS.OPEN);
});
