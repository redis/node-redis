import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import DISCARD from './DISCARD';
import { parseArgs } from './generic-transformers';

describe('DISCARD', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(DISCARD),
      ['DISCARD']
    );
  });

  testUtils.testWithClient('client.discard', async client => {
    await client.sendCommand(['MULTI']);

    assert.equal(
      await client.set('key', 'value'),
      'QUEUED'
    );

    assert.equal(
      await client.discard(),
      'OK'
    );

    assert.equal(
      await client.get('key'),
      null
    );
  }, GLOBAL.SERVERS.OPEN);
});
