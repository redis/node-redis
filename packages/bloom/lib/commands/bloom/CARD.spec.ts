import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../../test-utils';
import CARD from './CARD';

describe('BF.CARD', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      CARD.transformArguments('bloom'),
      ['BF.CARD', 'bloom']
    );
  });

  testUtils.testWithClient('client.bf.card', async client => {
    assert.equal(
      await client.bf.card('key'),
      0
    );
  }, GLOBAL.SERVERS.OPEN);
});
