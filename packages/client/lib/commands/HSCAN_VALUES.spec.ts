import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import HSCAN_VALUES from './HSCAN_VALUES';

describe('HSCAN_VALUES', () => {
  describe('transformArguments', () => {
    it('cusror only', () => {
      assert.deepEqual(
        HSCAN_VALUES.transformArguments('key', '0'),
        ['HSCAN', 'key', '0', 'VALUES']
      );
    });

    it('with MATCH', () => {
      assert.deepEqual(
        HSCAN_VALUES.transformArguments('key', '0', {
          MATCH: 'pattern'
        }),
        ['HSCAN', 'key', '0', 'MATCH', 'pattern', 'VALUES']
      );
    });

    it('with COUNT', () => {
      assert.deepEqual(
        HSCAN_VALUES.transformArguments('key', '0', {
          COUNT: 1
        }),
        ['HSCAN', 'key', '0', 'COUNT', '1', 'VALUES']
      );
    });

    it('with MATCH & COUNT', () => {
      assert.deepEqual(
        HSCAN_VALUES.transformArguments('key', '0', {
          MATCH: 'pattern',
          COUNT: 1
        }),
        ['HSCAN', 'key', '0', 'MATCH', 'pattern', 'COUNT', '1', 'VALUES']
      );
    });
  });

  testUtils.testWithClient('client.hScanValues', async client => {
    const [, reply] = await Promise.all([
      client.hSet('key', 'field', 'value'),
      client.hScanValues('key', '0')
    ]);

    assert.deepEqual(reply, {
      cursor: '0',
      entries: [
        'field',
      ]
    });
  }, GLOBAL.SERVERS.OPEN);
});
