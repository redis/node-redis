import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import CONFIG_SET from './CONFIG_SET';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('FT.CONFIG SET', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(CONFIG_SET, 'TIMEOUT', '500'),
      ['FT.CONFIG', 'SET', 'TIMEOUT', '500']
    );
  });

  testUtils.testWithClient('client.ft.configSet', async client => {
    assert.deepEqual(
      await client.ft.configSet('TIMEOUT', '500'),
      'OK'
    );
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClientIfVersionWithinRange([[8], 'LATEST'], 'setSearchConfigGloballyTest', async client => {

    const normalizeObject = obj => JSON.parse(JSON.stringify(obj));
    assert.equal(await client.configSet('search-default-dialect', '3'),
      'OK', 'CONFIG SET should return OK');

    assert.deepEqual(
      normalizeObject(await client.configGet('search-default-dialect')),
      { 'search-default-dialect': '3' },
      'CONFIG GET should return 3'
    );

    assert.deepEqual(
      normalizeObject(await client.ft.configGet('DEFAULT_DIALECT')),
      { 'DEFAULT_DIALECT': '3' },
      'FT.CONFIG GET should return 3'
    );

    const ftConfigSetResult = await client.ft.configSet('DEFAULT_DIALECT', '2');
    assert.equal(normalizeObject(ftConfigSetResult), 'OK', 'FT.CONFIG SET should return OK');

    assert.deepEqual(
      normalizeObject(await client.ft.configGet('DEFAULT_DIALECT')),
      { 'DEFAULT_DIALECT': '2' },
      'FT.CONFIG GET should return 2'
    );

    assert.deepEqual(
      normalizeObject(await client.configGet('search-default-dialect')),
      { 'search-default-dialect': '2' },
      'CONFIG GET should return 22'
    );

  }, GLOBAL.SERVERS.OPEN);

});
