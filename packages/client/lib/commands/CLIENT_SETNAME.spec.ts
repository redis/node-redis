import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';

import CLIENT_SETNAME from './CLIENT_SETNAME';

describe('CLIENT SETNAME', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      CLIENT_SETNAME.transformArguments('name'),
      ['CLIENT', 'SETNAME', 'name']
    );
  });

  testUtils.testWithClient('client.clientSetName', async client => {
    assert.equal(
      await client.clientSetName('name'),
      'OK'
    );
  }, GLOBAL.SERVERS.OPEN);
});
