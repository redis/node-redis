import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../../test-utils';
import EXISTS from './EXISTS';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('BF.EXISTS', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(EXISTS, 'key', 'item'),
      ['BF.EXISTS', 'key', 'item']
    );
  });

  testUtils.testWithClient('client.bf.exists', async client => {
    assert.equal(
      await client.bf.exists('key', 'item'),
      false
    );
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClient('client.bf.exists with existing item', async client => {
    await client.bf.add('key', 'item');

    assert.strictEqual(
      await client.bf.exists('key', 'item'),
      true
    );
  }, GLOBAL.SERVERS.OPEN);
});
