import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../../test-utils';
import ADD from './ADD';

describe('BF.ADD', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      ADD.transformArguments('key', 'item'),
      ['BF.ADD', 'key', 'item']
    );
  });

  testUtils.testWithClient('client.bf.add', async client => {
    assert.equal(
      await client.bf.add('key', 'item'),
      true
    );
  }, GLOBAL.SERVERS.OPEN);
});
