import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import XCLAIM from './XCLAIM';

describe('XCLAIM', () => {
  describe('transformArguments', () => {
    it('single id (string)', () => {
      assert.deepEqual(
        XCLAIM.transformArguments('key', 'group', 'consumer', 1, '0-0'),
        ['XCLAIM', 'key', 'group', 'consumer', '1', '0-0']
      );
    });

    it('multiple ids (array)', () => {
      assert.deepEqual(
        XCLAIM.transformArguments('key', 'group', 'consumer', 1, ['0-0', '1-0']),
        ['XCLAIM', 'key', 'group', 'consumer', '1', '0-0', '1-0']
      );
    });

    it('with IDLE', () => {
      assert.deepEqual(
        XCLAIM.transformArguments('key', 'group', 'consumer', 1, '0-0', {
          IDLE: 1
        }),
        ['XCLAIM', 'key', 'group', 'consumer', '1', '0-0', 'IDLE', '1']
      );
    });
    
    describe('with TIME', () => {
      it('number', () => {
        assert.deepEqual(
          XCLAIM.transformArguments('key', 'group', 'consumer', 1, '0-0', {
            TIME: 1
          }),
          ['XCLAIM', 'key', 'group', 'consumer', '1', '0-0', 'TIME', '1']
        );
      });
  
      it('Date', () => {
        const d = new Date();
        assert.deepEqual(
          XCLAIM.transformArguments('key', 'group', 'consumer', 1, '0-0', {
            TIME: d
          }),
          ['XCLAIM', 'key', 'group', 'consumer', '1', '0-0', 'TIME', d.getTime().toString()]
        );
      });
    });

    it('with RETRYCOUNT', () => {
      assert.deepEqual(
        XCLAIM.transformArguments('key', 'group', 'consumer', 1, '0-0', {
          RETRYCOUNT: 1
        }),
        ['XCLAIM', 'key', 'group', 'consumer', '1', '0-0', 'RETRYCOUNT', '1']
      );
    });

    it('with FORCE', () => {
      assert.deepEqual(
        XCLAIM.transformArguments('key', 'group', 'consumer', 1, '0-0', {
          FORCE: true
        }),
        ['XCLAIM', 'key', 'group', 'consumer', '1', '0-0', 'FORCE']
      );
    });

    it('with LASTID', () => {
      assert.deepEqual(
        XCLAIM.transformArguments('key', 'group', 'consumer', 1, '0-0', {
          LASTID: '0-0'
        }),
        ['XCLAIM', 'key', 'group', 'consumer', '1', '0-0', 'LASTID', '0-0']
      );
    });

    it('with IDLE, TIME, RETRYCOUNT, FORCE, LASTID', () => {
      assert.deepEqual(
        XCLAIM.transformArguments('key', 'group', 'consumer', 1, '0-0', {
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

  // TODO: test with messages
  testUtils.testAll('xClaim', async client => {
    const [, reply] = await Promise.all([
      client.xGroupCreate('key', 'group', '$', {
        MKSTREAM: true
      }),
      client.xClaim('key', 'group', 'consumer', 1, '0-0')
    ]);

    assert.deepEqual(reply, []);
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
