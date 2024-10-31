import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import HPTTL from './HPTTL';
import { HASH_EXPIRATION_TIME } from './HEXPIRETIME';
import { parseArgs } from './generic-transformers';

describe('HPTTL', () => {
  testUtils.isVersionGreaterThanHook([7, 4]);

  describe('transformArguments', () => {
    it('string', () => {
      assert.deepEqual(
        parseArgs(HPTTL, 'key', 'field'),
        ['HPTTL', 'key', 'FIELDS', '1', 'field']
      );
    });

    it('array', () => {
      assert.deepEqual(
        parseArgs(HPTTL, 'key', ['field1', 'field2']),
        ['HPTTL', 'key', 'FIELDS', '2', 'field1', 'field2']
      );
    });
  });

  testUtils.testWithClient('hpTTL', async client => {
    assert.deepEqual(
      await client.hpTTL('key', 'field1'),
      [HASH_EXPIRATION_TIME.FIELD_NOT_EXISTS]
    );
  }, {
    ...GLOBAL.SERVERS.OPEN
  });
});
