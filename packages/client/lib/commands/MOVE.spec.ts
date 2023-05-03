import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import MOVE from './MOVE';

describe('MOVE', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      MOVE.transformArguments('key', 1),
      ['MOVE', 'key', '1']
    );
  });

  testUtils.testAll('move', async client => {
    assert.equal(
      await client.move('key', 1),
      1
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
