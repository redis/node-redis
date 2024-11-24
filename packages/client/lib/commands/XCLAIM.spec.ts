import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import XCLAIM from './XCLAIM';
import { parseArgs } from './generic-transformers';

describe('XCLAIM', () => {
  describe('transformArguments', () => {
    it('single id (string)', () => {
      assert.deepEqual(
        parseArgs(XCLAIM, 'key', 'group', 'consumer', 1, '0-0'),
        ['XCLAIM', 'key', 'group', 'consumer', '1', '0-0']
      );
    });

    it('multiple ids (array)', () => {
      assert.deepEqual(
        parseArgs(XCLAIM, 'key', 'group', 'consumer', 1, ['0-0', '1-0']),
        ['XCLAIM', 'key', 'group', 'consumer', '1', '0-0', '1-0']
      );
    });

    it('with IDLE', () => {
      assert.deepEqual(
        parseArgs(XCLAIM, 'key', 'group', 'consumer', 1, '0-0', {
          IDLE: 1
        }),
        ['XCLAIM', 'key', 'group', 'consumer', '1', '0-0', 'IDLE', '1']
      );
    });
    
    describe('with TIME', () => {
      it('number', () => {
        assert.deepEqual(
          parseArgs(XCLAIM, 'key', 'group', 'consumer', 1, '0-0', {
            TIME: 1
          }),
          ['XCLAIM', 'key', 'group', 'consumer', '1', '0-0', 'TIME', '1']
        );
      });
  
      it('Date', () => {
        const d = new Date();
        assert.deepEqual(
          parseArgs(XCLAIM, 'key', 'group', 'consumer', 1, '0-0', {
            TIME: d
          }),
          ['XCLAIM', 'key', 'group', 'consumer', '1', '0-0', 'TIME', d.getTime().toString()]
        );
      });
    });

    it('with RETRYCOUNT', () => {
      assert.deepEqual(
        parseArgs(XCLAIM, 'key', 'group', 'consumer', 1, '0-0', {
          RETRYCOUNT: 1
        }),
        ['XCLAIM', 'key', 'group', 'consumer', '1', '0-0', 'RETRYCOUNT', '1']
      );
    });

    it('with FORCE', () => {
      assert.deepEqual(
        parseArgs(XCLAIM, 'key', 'group', 'consumer', 1, '0-0', {
          FORCE: true
        }),
        ['XCLAIM', 'key', 'group', 'consumer', '1', '0-0', 'FORCE']
      );
    });

    it('with LASTID', () => {
      assert.deepEqual(
        parseArgs(XCLAIM, 'key', 'group', 'consumer', 1, '0-0', {
          LASTID: '0-0'
        }),
        ['XCLAIM', 'key', 'group', 'consumer', '1', '0-0', 'LASTID', '0-0']
      );
    });

    it('with IDLE, TIME, RETRYCOUNT, FORCE, LASTID', () => {
      assert.deepEqual(
        parseArgs(XCLAIM, 'key', 'group', 'consumer', 1, '0-0', {
          IDLE: 1,
          TIME: 1,
          RETRYCOUNT: 1,
          FORCE: true,
          LASTID: '0-0'
        }),
        ['XCLAIM', 'key', 'group', 'consumer', '1', '0-0', 'IDLE', '1', 'TIME', '1', 'RETRYCOUNT', '1', 'FORCE', 'LASTID', '0-0']
      );
    });
  });

  testUtils.testAll('xClaim', async client => {
    const message = Object.create(null, {
      field: {
        value: 'value',
        enumerable: true
      }
    });

    const [, , , , , reply] = await Promise.all([
      client.xGroupCreate('key', 'group', '$', {
        MKSTREAM: true
      }),
      client.xAdd('key', '1-0', message),
      client.xAdd('key', '2-0', message),
      client.xReadGroup('group', 'consumer', {
        key: 'key',
        id: '>'
      }),
      client.xTrim('key', 'MAXLEN', 1),
      client.xClaim('key', 'group', 'consumer', 0, ['1-0', '2-0'])
    ]);

    assert.deepEqual(reply, [
      ...(testUtils.isVersionGreaterThan([7, 0]) ? [] : [null]),
      {
        id: '2-0',
        message
      }
    ]);
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
