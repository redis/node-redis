import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './HTTL';
import { HASH_EXPIRATION_TIME } from './HEXPIRETIME';

describe('HTTL', () => {
  testUtils.isVersionGreaterThanHook([7, 4]);

  describe('transformArguments', () => {
    it('string', () => {
      assert.deepEqual(
        transformArguments('key', 'field'),
        ['HTTL', 'key', 'FIELDS', '1', 'field']
      );
    });

    it('array', () => {
      assert.deepEqual(
        transformArguments('key', ['field1', 'field2']),
        ['HTTL', 'key', 'FIELDS', '2', 'field1', 'field2']
      );
    });
  
  });

  testUtils.testWithClient('hTTL', async client => {
    assert.deepEqual(
      await client.hTTL('key', 'field1'),
      [ HASH_EXPIRATION_TIME.FieldNotExists ]
    );
  }, {
    ...GLOBAL.SERVERS.OPEN
  });
});
