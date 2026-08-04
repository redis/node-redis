import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ARSEEK from './ARSEEK';
import { parseArgs } from './generic-transformers';

describe('ARSEEK', () => {
  describe('transformArguments', () => {
    it('number index', () => {
      assert.deepEqual(
        parseArgs(ARSEEK, 'key', 10),
        ['ARSEEK', 'key', '10']
      );
    });

    it('string index for >Number.MAX_SAFE_INTEGER', () => {
      assert.deepEqual(
        parseArgs(ARSEEK, 'key', '18446744073709551614'),
        ['ARSEEK', 'key', '18446744073709551614']
      );
    });
  });

  testUtils.testWithClientIfVersionWithinRange([[8, 8], 'LATEST'], 'arSeek', async client => {
    await client.arInsert('key', 'v0');
    assert.equal(
      await client.arSeek('key', 10),
      1
    );
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClientIfVersionWithinRange([[8, 8], 'LATEST'], 'arSeek with string index >2^53', async client => {
    await client.arInsert('key', 'v0');
    // 2^54 - 1, exceeds Number.MAX_SAFE_INTEGER; must be passed as a string
    assert.equal(
      await client.arSeek('key', '18014398509481983'),
      1
    );
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClientIfVersionWithinRange([[8, 8], 'LATEST'], 'arSeek on missing key returns 0', async client => {
    assert.equal(await client.arSeek('missing', 10), 0);
  }, GLOBAL.SERVERS.OPEN);
});
