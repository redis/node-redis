import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import HPEXPIRETIME from './HPEXPIRETIME';
import { HASH_EXPIRATION_TIME } from './HEXPIRETIME';

describe('HPEXPIRETIME', () => {
  testUtils.isVersionGreaterThanHook([7, 4]);

  describe('transformArguments', () => {
    it('string', () => {
      assert.deepEqual(
        HPEXPIRETIME.transformArguments('key', 'field'),
        ['HPEXPIRETIME', 'key', 'FIELDS', '1', 'field']
      );
    });

    it('array', () => {
      assert.deepEqual(
        HPEXPIRETIME.transformArguments('key', ['field1', 'field2']),
        ['HPEXPIRETIME', 'key', 'FIELDS', '2', 'field1', 'field2']
      );
    });
  });

  testUtils.testWithClient('hpExpireTime', async client => {
    assert.deepEqual(
      await client.hpExpireTime('key', 'field1'),
      [HASH_EXPIRATION_TIME.FIELD_NOT_EXISTS]
    );
  }, {
    ...GLOBAL.SERVERS.OPEN
  });
});
