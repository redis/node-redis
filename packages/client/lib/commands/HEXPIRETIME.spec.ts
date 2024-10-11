import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import HEXPIRETIME, { HASH_EXPIRATION_TIME }  from './HEXPIRETIME';

describe('HEXPIRETIME', () => {
  testUtils.isVersionGreaterThanHook([7, 4]);

  describe('transformArguments', () => {
    it('string', () => {
      assert.deepEqual(
        HEXPIRETIME.transformArguments('key', 'field'),
        ['HEXPIRETIME', 'key', 'FIELDS', '1', 'field']
      );
    });

    it('array', () => {
      assert.deepEqual(
        HEXPIRETIME.transformArguments('key', ['field1', 'field2']),
        ['HEXPIRETIME', 'key', 'FIELDS', '2', 'field1', 'field2']
      );
    });
  })

  testUtils.testWithClient('hExpireTime', async client => {
    assert.deepEqual(
      await client.hExpireTime('key', 'field1'),
      [HASH_EXPIRATION_TIME.FIELD_NOT_EXISTS]
    );
  }, {
    ...GLOBAL.SERVERS.OPEN,
  });
});
