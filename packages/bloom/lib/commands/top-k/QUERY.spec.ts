import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../../test-utils';
import QUERY from './QUERY';

describe('TOPK.QUERY', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      QUERY.transformArguments('key', 'item'),
      ['TOPK.QUERY', 'key', 'item']
    );
  });

  testUtils.testWithClient('client.topK.query', async client => {
    const [, reply] = await Promise.all([
      client.topK.reserve('key', 3),
      client.topK.query('key', 'item')
    ]);

    assert.deepEqual(reply, [false]);
  }, GLOBAL.SERVERS.OPEN);
});
