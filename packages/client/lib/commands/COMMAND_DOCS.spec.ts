import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import COMMAND_DOCS from './COMMAND_DOCS';

describe('COMMAND DOCS', () => {
  testUtils.testWithClient('client.commandDocs()', async client => {
    const result = await client.commandDocs();
    assert.equal(typeof result, 'object');
    // Verify structure of at least one entry
    const firstKey = Object.keys(result)[0];
    if (firstKey) {
      const entry = result[firstKey];
      assert.equal(typeof entry, 'object');
      // 'arguments' should be an array of objects if present
      if (entry.arguments) {
        assert.ok(Array.isArray(entry.arguments));
        for (const arg of entry.arguments) {
          assert.equal(typeof arg.name, 'string');
          assert.equal(typeof arg.type, 'string');
        }
      }
    }
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClient('client.commandDocs("GET", "SET")', async client => {
    const result = await client.commandDocs('GET', 'SET');
    assert.equal(typeof result, 'object');
    // Redis returns lowercase command names
    assert.ok('get' in result || 'set' in result);
    
    // Verify the returned entry has proper structure
    const key = 'get' in result ? 'get' : 'set';
    const entry = result[key];
    assert.equal(typeof entry, 'object');
    
    // Check arguments transformation if present
    if (entry.arguments) {
      assert.ok(Array.isArray(entry.arguments));
      for (const arg of entry.arguments) {
        assert.equal(typeof arg, 'object');
        assert.equal(typeof arg.name, 'string');
        assert.equal(typeof arg.type, 'string');
      }
    }
  }, GLOBAL.SERVERS.OPEN);
});
