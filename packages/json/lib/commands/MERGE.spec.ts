import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import MERGE from './MERGE';

describe('JSON.MERGE', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      MERGE.transformArguments('key', '$', 'value'),
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
