import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './HPERSIST';
import { HASH_EXPIRATION_TIME } from './HEXPIRETIME';

describe('HPERSIST', () => {
  testUtils.isVersionGreaterThanHook([7, 4]);
  
  describe('transformArguments', () => {
    it('string', () => {
      assert.deepEqual(
        transformArguments('key', 'field'),
        ['HPERSIST', 'key', 'FIELDS', '1', 'field']
      );
    });

    it('array', () => {
      assert.deepEqual(
        transformArguments('key', ['field1', 'field2']),
        ['HPERSIST', 'key', 'FIELDS', '2', 'field1', 'field2']
      );
    });
  })

  testUtils.testWithClient('hPersist', async client => {
    assert.deepEqual(
      await client.hPersist('key', 'field1'),
      [ HASH_EXPIRATION_TIME.FieldNotExists ]
    );
  }, {
    ...GLOBAL.SERVERS.OPEN,
  });
});
