import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import GETEX from './GETEX';

describe('GETEX', () => {
  testUtils.isVersionGreaterThanHook([6, 2]);

  describe('transformArguments', () => {
    it('EX | PX', () => {
      assert.deepEqual(
        GETEX.transformArguments('key', {
          type: 'EX',
          value: 1
        }),
        ['GETEX', 'key', 'EX', '1']
      );
    });

    it('EX (backwards compatibility)', () => {
      assert.deepEqual(
        GETEX.transformArguments('key', {
          EX: 1
        }),
        ['GETEX', 'key', 'EX', '1']
      );
    });

    it('PX (backwards compatibility)', () => {
      assert.deepEqual(
        GETEX.transformArguments('key', {
          PX: 1
        }),
        ['GETEX', 'key', 'PX', '1']
      );
    });

    describe('EXAT | PXAT', () => {
      it('number', () => {
        assert.deepEqual(
          GETEX.transformArguments('key', {
            type: 'EXAT',
            value: 1
          }),
          ['GETEX', 'key', 'EXAT', '1']
        );
      });

      it('date', () => {
        const d = new Date();
        assert.deepEqual(
          GETEX.transformArguments('key', {
            EXAT: d
          }),
          ['GETEX', 'key', 'EXAT', Math.floor(d.getTime() / 1000).toString()]
        );
      });
    });

    describe('EXAT (backwards compatibility)', () => {
      it('number', () => {
        assert.deepEqual(
          GETEX.transformArguments('key', {
            EXAT: 1
          }),
          ['GETEX', 'key', 'EXAT', '1']
        );
      });

      it('date', () => {
        const d = new Date();
        assert.deepEqual(
          GETEX.transformArguments('key', {
            EXAT: d
          }),
          ['GETEX', 'key', 'EXAT', Math.floor(d.getTime() / 1000).toString()]
        );
      });
    });

    describe('PXAT (backwards compatibility)', () => {
      it('number', () => {
        assert.deepEqual(
          GETEX.transformArguments('key', {
            PXAT: 1
          }),
          ['GETEX', 'key', 'PXAT', '1']
        );
      });

      it('date', () => {
        const d = new Date();
        assert.deepEqual(
          GETEX.transformArguments('key', {
            PXAT: d
          }),
          ['GETEX', 'key', 'PXAT', d.getTime().toString()]
        );
      });
    });

    it('PERSIST (backwards compatibility)', () => {
      assert.deepEqual(
        GETEX.transformArguments('key', {
          PERSIST: true
        }),
        ['GETEX', 'key', 'PERSIST']
      );
    });
  });

  testUtils.testAll('getEx', async client => {
    assert.equal(
      await client.getEx('key', {
        type: 'PERSIST'
      }),
      null
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
