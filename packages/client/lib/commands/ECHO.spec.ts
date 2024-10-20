import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ECHO from './ECHO';
import { parseArgs } from './generic-transformers';

describe('ECHO', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(ECHO, 'message'),
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
