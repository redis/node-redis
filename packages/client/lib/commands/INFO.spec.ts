import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import INFO from './INFO';
import { parseArgs } from './generic-transformers';

describe('INFO', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(INFO),
        ['INFO']
      );
    });

    it('server section', () => {
      assert.deepEqual(
        parseArgs(INFO, 'server'),
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

  testUtils.testWithClient('client.info structural shape', async client => {
    const reply = await client.info();

    // RESP2 returns a bulk string with specific format
    assert.equal(typeof reply, 'string');

    // Must contain section headers starting with '#'
    assert.ok(reply.includes('# Server') || reply.includes('# CPU'),
      'INFO response should contain section headers starting with #');

    // Must contain field:value pairs
    assert.ok(/\w+:\w+/.test(reply),
      'INFO response should contain field:value pairs');

    // Should contain line breaks (fields are line-separated)
    assert.ok(reply.includes('\r\n') || reply.includes('\n'),
      'INFO response should contain line breaks');
  }, GLOBAL.SERVERS.OPEN);
});
