import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './HPTTL';
import { HASH_EXPIRATION_TIME } from './HEXPIRETIME';

describe('HPTTL', () => {
  testUtils.isVersionGreaterThanHook([7, 4]);

  describe('transformArguments', () => {
    it('string', () => {
      assert.deepEqual(
        transformArguments('key', 'field'),
        ['HPTTL', 'key', 'FIELDS', '1', 'field']
      );
    });

    it('array', () => {
      assert.deepEqual(
        transformArguments('key', ['field1', 'field2']),
        ['HPTTL', 'key', 'FIELDS', '2', 'field1', 'field2']
      );
    });
  });

  testUtils.testWithClient('hpTTL', async client => {
    assert.deepEqual(
      await client.hpTTL('key', 'field1'),
      [ HASH_EXPIRATION_TIME.FieldNotExists ]
    );
  }, {
    ...GLOBAL.SERVERS.OPEN
  });
});
