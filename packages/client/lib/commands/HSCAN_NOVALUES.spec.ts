import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import HSCAN_NOVALUES from './HSCAN_NOVALUES';

describe('HSCAN_NOVALUES', () => {
  testUtils.isVersionGreaterThanHook([7.4]);
  
  describe('transformArguments', () => {
    it('cusror only', () => {
      assert.deepEqual(
        HSCAN_NOVALUES.transformArguments('key', '0'),
        ['HSCAN', 'key', '0', 'NOVALUES']
      );
    });

    it('with MATCH', () => {
      assert.deepEqual(
        HSCAN_NOVALUES.transformArguments('key', '0', {
          MATCH: 'pattern'
        }),
        ['HSCAN', 'key', '0', 'MATCH', 'pattern', 'NOVALUES']
      );
    });

    it('with COUNT', () => {
      assert.deepEqual(
        HSCAN_NOVALUES.transformArguments('key', '0', {
          COUNT: 1
        }),
        ['HSCAN', 'key', '0', 'COUNT', '1', 'NOVALUES']
      );
    });

    it('with MATCH & COUNT', () => {
      assert.deepEqual(
        HSCAN_NOVALUES.transformArguments('key', '0', {
          MATCH: 'pattern',
          COUNT: 1
        }),
        ['HSCAN', 'key', '0', 'MATCH', 'pattern', 'COUNT', '1', 'NOVALUES']
      );
    });
  });

  testUtils.testWithClient('client.hScanNoValues', async client => {
    const [, reply] = await Promise.all([
      client.hSet('key', 'field', 'value'),
      client.hScanNoValues('key', '0')
    ]);

    assert.deepEqual(reply, {
      cursor: '0',
      fields: [
        'field',
      ]
    });
  }, GLOBAL.SERVERS.OPEN);
});
