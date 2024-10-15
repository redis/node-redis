import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import TIME from './TIME';

describe('TIME', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      TIME.transformArguments(),
      ['TIME']
    );
  });

  testUtils.testWithClient('client.time', async client => {
    const reply = await client.time();
    assert.ok(Array.isArray(reply));
    assert.equal(typeof reply[0], 'string');
    assert.equal(typeof reply[1], 'string');
  }, GLOBAL.SERVERS.OPEN);
});
