import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import HEXPIREAT from './HEXPIREAT';
import { HASH_EXPIRATION_TIME } from './HEXPIRETIME';

describe('HEXPIREAT', () => {
  testUtils.isVersionGreaterThanHook([7, 4]);

  describe('transformArguments', () => {
    it('string + number', () => {
      assert.deepEqual(
        HEXPIREAT.transformArguments('key', 'field', 1),
        ['HEXPIREAT', 'key', '1', 'FIELDS', '1', 'field']
      );
    });

    it('array + number', () => {
      assert.deepEqual(
        HEXPIREAT.transformArguments('key', ['field1', 'field2'], 1),
        ['HEXPIREAT', 'key', '1', 'FIELDS', '2', 'field1', 'field2']
      );
    });

    it('date', () => {
      const d = new Date();

      assert.deepEqual(
        HEXPIREAT.transformArguments('key', ['field1'], d),
        ['HEXPIREAT', 'key', Math.floor(d.getTime() / 1000).toString(), 'FIELDS', '1', 'field1']
      );
    });

    it('with set option', () => {
      assert.deepEqual(
        HEXPIREAT.transformArguments('key', 'field1', 1, 'GT'),
        ['HEXPIREAT', 'key', '1', 'GT', 'FIELDS', '1', 'field1']
      );
    });
  });

  testUtils.testWithClient('expireAt', async client => {
    assert.deepEqual(
      await client.hExpireAt('key', 'field1', 1),
      [HASH_EXPIRATION_TIME.FIELD_NOT_EXISTS]
    );
  }, {
    ...GLOBAL.SERVERS.OPEN,
  });
});
