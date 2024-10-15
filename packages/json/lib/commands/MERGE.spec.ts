import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import MERGE from './MERGE';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('JSON.MERGE', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(MERGE, 'key', '$', 'value'),
      ['JSON.MERGE', 'key', '$', '"value"']
    );
  });

  testUtils.testWithClient('client.json.merge', async client => {
    assert.equal(
      await client.json.merge('key', '$', 'value'),
      'OK'
    );
  }, GLOBAL.SERVERS.OPEN);
});
