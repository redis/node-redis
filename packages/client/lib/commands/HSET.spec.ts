import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import HSET from './HSET';

describe('HSET', () => {
  describe('transformArguments', () => {
    describe('field, value', () => {
      it('string', () => {
        assert.deepEqual(
          HSET.transformArguments('key', 'field', 'value'),
          ['HSET', 'key', 'field', 'value']
        );
      });

      it('number', () => {
        assert.deepEqual(
          HSET.transformArguments('key', 1, 2),
          ['HSET', 'key', '1', '2']
        );
      });

      it('Buffer', () => {
        assert.deepEqual(
          HSET.transformArguments(Buffer.from('key'), Buffer.from('field'), Buffer.from('value')),
          ['HSET', Buffer.from('key'), Buffer.from('field'), Buffer.from('value')]
        );
      });
    });

    it('Map', () => {
      assert.deepEqual(
        HSET.transformArguments('key', new Map([['field', 'value']])),
        ['HSET', 'key', 'field', 'value']
      );
    });

    it('Array', () => {
      assert.deepEqual(
        HSET.transformArguments('key', [['field', 'value']]),
        ['HSET', 'key', 'field', 'value']
      );
    });

    describe('Object', () => {
      it('string', () => {
        assert.deepEqual(
          HSET.transformArguments('key', { field: 'value' }),
          ['HSET', 'key', 'field', 'value']
        );
      });

      it('Buffer', () => {
        assert.deepEqual(
          HSET.transformArguments('key', { field: Buffer.from('value') }),
          ['HSET', 'key', 'field', Buffer.from('value')]
        );
      });
    });
  });

  testUtils.testAll('hSet', async client => {
    assert.equal(
      await client.hSet('key', 'field', 'value'),
      1
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
