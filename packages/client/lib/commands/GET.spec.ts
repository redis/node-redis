import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import { parseArgs } from './generic-transformers';
import GET from './GET';

describe('GET Command', () => {

  describe('transformArguments', () => {
    it('should build correct Redis command', () => {
      assert.deepEqual(parseArgs(GET, 'my-key'), ['GET', 'my-key']);
      assert.deepEqual(parseArgs(GET, ''), ['GET', '']);


      const binaryKey = Buffer.from('binary-key');
      assert.deepEqual(parseArgs(GET, binaryKey), ['GET', binaryKey]);
    });
  });

  describe('transformReply', () => {
    testUtils.testAll('get', async client => {

      const missing = await client.get('nonexistent');
      assert.equal(missing, null, 'Should return null for missing keys');


      await client.set('string-key', 'hello');
      const stringVal = await client.get('string-key');
      assert.equal(stringVal, 'hello', 'Should return string value');


      await client.set('num-key', '123');
      const numVal = await client.get('num-key');
      assert.equal(numVal, '123', 'Should return numeric string as string');


      await client.set('buffer-key', Buffer.from('buffered'));
      const bufferVal = await client.get('buffer-key');
      assert.equal(typeof bufferVal, 'string', 'Should return a string even if input was buffer');
      assert.equal(bufferVal, 'buffered', 'Should convert buffer to string');


      await client.set('empty-key', '');
      const emptyVal = await client.get('empty-key');
      assert.equal(emptyVal, '', 'Should handle empty string values');


      await client.set('overwrite-key', 'first');
      await client.set('overwrite-key', 'second');
      const overwriteVal = await client.get('overwrite-key');
      assert.equal(overwriteVal, 'second', 'Should return updated value');

    }, {
      client: GLOBAL.SERVERS.OPEN,
      cluster: GLOBAL.CLUSTERS.OPEN,
    });
  });
});