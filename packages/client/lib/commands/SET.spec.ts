import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SET from './SET';

describe('SET', () => {
  describe('transformArguments', () => {
    describe('value', () => {
      it('string', () => {
        assert.deepEqual(
          SET.transformArguments('key', 'value'),
          ['SET', 'key', 'value']
        );
      });
  
      it('number', () => {
        assert.deepEqual(
          SET.transformArguments('key', 0),
          ['SET', 'key', '0']
        );
      });
    });

    describe('expiration', () => {
      it('\'KEEPTTL\'', () => {
        assert.deepEqual(
          SET.transformArguments('key', 'value', {
            expiration: 'KEEPTTL'
          }),
          ['SET', 'key', 'value', 'KEEPTTL']
        );
      });

      it('{ type: \'KEEPTTL\' }', () => {
        assert.deepEqual(
          SET.transformArguments('key', 'value', {
            expiration: {
              type: 'KEEPTTL'
            }
          }),
          ['SET', 'key', 'value', 'KEEPTTL']
        );
      });

      it('{ type: \'EX\' }', () => {
        assert.deepEqual(
          SET.transformArguments('key', 'value', {
            expiration: {
              type: 'EX',
              value: 0
            }
          }),
          ['SET', 'key', 'value', 'EX', '0']
        );
      });

      it('with EX (backwards compatibility)', () => {
        assert.deepEqual(
          SET.transformArguments('key', 'value', {
            EX: 0
          }),
          ['SET', 'key', 'value', 'EX', '0']
        );
      });

      it('with PX (backwards compatibility)', () => {
        assert.deepEqual(
          SET.transformArguments('key', 'value', {
            PX: 0
          }),
          ['SET', 'key', 'value', 'PX', '0']
        );
      });

      it('with EXAT (backwards compatibility)', () => {
        assert.deepEqual(
          SET.transformArguments('key', 'value', {
            EXAT: 0
          }),
          ['SET', 'key', 'value', 'EXAT', '0']
        );
      });

      it('with PXAT (backwards compatibility)', () => {
        assert.deepEqual(
          SET.transformArguments('key', 'value', {
            PXAT: 0
          }),
          ['SET', 'key', 'value', 'PXAT', '0']
        );
      });

      it('with KEEPTTL (backwards compatibility)', () => {
        assert.deepEqual(
          SET.transformArguments('key', 'value', {
            KEEPTTL: true
          }),
          ['SET', 'key', 'value', 'KEEPTTL']
        );
      });
    });

    describe('condition', () => {
      it('with condition', () => {
        assert.deepEqual(
          SET.transformArguments('key', 'value', {
            condition: 'NX'
          }),
          ['SET', 'key', 'value', 'NX']
        );
      });

      it('with NX (backwards compatibility)', () => {
        assert.deepEqual(
          SET.transformArguments('key', 'value', {
            NX: true
          }),
          ['SET', 'key', 'value', 'NX']
        );
      });

      it('with XX (backwards compatibility)', () => {
        assert.deepEqual(
          SET.transformArguments('key', 'value', {
            XX: true
          }),
          ['SET', 'key', 'value', 'XX']
        );
      });
    });

    it('with GET', () => {
      assert.deepEqual(
        SET.transformArguments('key', 'value', {
          GET: true
        }),
        ['SET', 'key', 'value', 'GET']
      );
    });

    it('with expiration, condition, GET', () => {
      assert.deepEqual(
        SET.transformArguments('key', 'value', {
          expiration: {
            type: 'EX',
            value: 0 
          },
          condition: 'NX',
          GET: true
        }),
        ['SET', 'key', 'value', 'EX', '0', 'NX', 'GET']
      );
    });
  });

  testUtils.testAll('set', async client => {
    assert.equal(
      await client.set('key', 'value'),
      'OK'
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
