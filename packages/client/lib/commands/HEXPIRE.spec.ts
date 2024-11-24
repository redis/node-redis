import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import HEXPIRE from './HEXPIRE';
import { parseArgs } from './generic-transformers';
import { HASH_EXPIRATION_TIME } from './HEXPIRETIME';

describe('HEXPIRE', () => {
  testUtils.isVersionGreaterThanHook([7, 4]);

  describe('transformArguments', () => {
    it('string', () => {
      assert.deepEqual(
        parseArgs(HEXPIRE, 'key', 'field', 1),
        ['HEXPIRE', 'key', '1', 'FIELDS', '1', 'field']
      );
    });

    it('array', () => {
      assert.deepEqual(
        parseArgs(HEXPIRE, 'key', ['field1', 'field2'], 1),
        ['HEXPIRE', 'key', '1', 'FIELDS', '2', 'field1', 'field2']
      );
    });

    it('with set option', () => {
      assert.deepEqual(
        parseArgs(HEXPIRE, 'key', ['field1'], 1, 'NX'),
        ['HEXPIRE', 'key', '1', 'NX', 'FIELDS', '1', 'field1']
      );
    });
  });

  testUtils.testWithClient('hexpire', async client => {
    assert.deepEqual(
      await client.hExpire('key', ['field1'], 0),
      [HASH_EXPIRATION_TIME.FIELD_NOT_EXISTS]
    );
  }, {
    ...GLOBAL.SERVERS.OPEN
  });
});
