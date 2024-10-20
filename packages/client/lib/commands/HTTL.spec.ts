import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import HTTL from './HTTL';
import { HASH_EXPIRATION_TIME } from './HEXPIRETIME';
import { parseArgs } from './generic-transformers';

describe('HTTL', () => {
  testUtils.isVersionGreaterThanHook([7, 4]);

  describe('transformArguments', () => {
    it('string', () => {
      assert.deepEqual(
        parseArgs(HTTL, 'key', 'field'),
        ['HTTL', 'key', 'FIELDS', '1', 'field']
      );
    });

    it('array', () => {
      assert.deepEqual(
        parseArgs(HTTL, 'key', ['field1', 'field2']),
        ['HTTL', 'key', 'FIELDS', '2', 'field1', 'field2']
      );
    });
  });

  testUtils.testWithClient('hTTL', async client => {
    assert.deepEqual(
      await client.hTTL('key', 'field1'),
      [HASH_EXPIRATION_TIME.FIELD_NOT_EXISTS]
    );
  }, {
    ...GLOBAL.SERVERS.OPEN
  });
});
