import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import INFO from './INFO';

describe('INFO', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        INFO.transformArguments(),
        ['INFO']
      );
    });

    it('server section', () => {
      assert.deepEqual(
        INFO.transformArguments('server'),
        ['INFO', 'server']
      );
    });
  });

  testUtils.testWithClient('client.info', async client => {
    assert.equal(
      typeof await client.info(),
      'string'
    );
  }, GLOBAL.SERVERS.OPEN);
});
