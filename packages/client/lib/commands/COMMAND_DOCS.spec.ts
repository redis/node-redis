import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import COMMAND_DOCS from './COMMAND_DOCS';

describe('COMMAND DOCS', () => {
  testUtils.testWithClient('client.commandDocs()', async client => {
    const result = await client.commandDocs();
    assert.equal(typeof result, 'object');
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClient('client.commandDocs("GET", "SET")', async client => {
    const result = await client.commandDocs('GET', 'SET');
    assert.equal(typeof result, 'object');
    assert.ok('GET' in result || 'SET' in result);
  }, GLOBAL.SERVERS.OPEN);
});
