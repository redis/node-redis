import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import { parseArgs } from './generic-transformers';
import HSCAN from './HSCAN';

describe('HSCAN', () => {
  describe('transformArguments', () => {
    it('cusror only', () => {
      assert.deepEqual(
        parseArgs(HSCAN, 'key', '0'),
        ['HSCAN', 'key', '0']
      );
    });

    it('with MATCH', () => {
      assert.deepEqual(
        parseArgs(HSCAN, 'key', '0', {
          MATCH: 'pattern'
        }),
        ['HSCAN', 'key', '0', 'MATCH', 'pattern']
      );
    });

    it('with COUNT', () => {
      assert.deepEqual(
        parseArgs(HSCAN, 'key', '0', {
          COUNT: 1
        }),
        ['HSCAN', 'key', '0', 'COUNT', '1']
      );
    });

    it('with MATCH & COUNT', () => {
      assert.deepEqual(
        parseArgs(HSCAN, 'key', '0', {
          MATCH: 'pattern',
          COUNT: 1
        }),
        ['HSCAN', 'key', '0', 'MATCH', 'pattern', 'COUNT', '1']
      );
    });
  });

  describe('transformReply', () => {
    it('without tuples', () => {
      assert.deepEqual(
        HSCAN.transformReply(['0' as any, []]),
        {
          cursor: '0',
          entries: []
        }
      );
    });
    
    it('with tuples', () => {
      assert.deepEqual(
        HSCAN.transformReply(['0' as any, ['field', 'value'] as any]),
        {
          cursor: '0',
          entries: [{
            field: 'field',
            value: 'value'
          }]
        }
      );
    });
  });

  testUtils.testWithClient('client.hScan', async client => {
    const [, reply] = await Promise.all([
      client.hSet('key', 'field', 'value'),
      client.hScan('key', '0')
    ]);

    assert.deepEqual(reply, {
      cursor: '0',
      entries: [{
        field: 'field',
        value: 'value'
      }]
    });
  }, GLOBAL.SERVERS.OPEN);
});
