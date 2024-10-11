import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import HPERSIST from './HPERSIST';
import { HASH_EXPIRATION_TIME } from './HEXPIRETIME';

describe('HPERSIST', () => {
  testUtils.isVersionGreaterThanHook([7, 4]);
  
  describe('transformArguments', () => {
    it('string', () => {
      assert.deepEqual(
        HPERSIST.transformArguments('key', 'field'),
        ['HPERSIST', 'key', 'FIELDS', '1', 'field']
      );
    });

    it('array', () => {
      assert.deepEqual(
        HPERSIST.transformArguments('key', ['field1', 'field2']),
        ['HPERSIST', 'key', 'FIELDS', '2', 'field1', 'field2']
      );
    });
  })

  testUtils.testWithClient('hPersist', async client => {
    assert.deepEqual(
      await client.hPersist('key', 'field1'),
      [HASH_EXPIRATION_TIME.FIELD_NOT_EXISTS]
    );
  }, {
    ...GLOBAL.SERVERS.OPEN,
  });
});
