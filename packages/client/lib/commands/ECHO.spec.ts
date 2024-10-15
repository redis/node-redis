import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ECHO from './ECHO';

describe('ECHO', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      ECHO.transformArguments('message'),
      ['ECHO', 'message']
    );
  });

  testUtils.testWithClient('client.echo', async client => {
    assert.equal(
      await client.echo('message'),
      'message'
    );
  }, GLOBAL.SERVERS.OPEN);
});
