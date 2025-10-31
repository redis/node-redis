
import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SET from './SET';
import { parseArgs } from './generic-transformers';

describe('SET', () => {
  describe('transformArguments', () => {
    describe('value', () => {
      it('string', () => {
        assert.deepEqual(
          parseArgs(SET, 'key', 'value'),
          ['SET', 'key', 'value']
        );
      });
  
      it('number', () => {
        assert.deepEqual(
          parseArgs(SET, 'key', 0),
          ['SET', 'key', '0']
        );
      });
    });

    describe('expiration', () => {
      it('\'KEEPTTL\'', () => {
        assert.deepEqual(
          parseArgs(SET, 'key', 'value', {
            expiration: 'KEEPTTL'
          }),
          ['SET', 'key', 'value', 'KEEPTTL']
        );
      });

      it('{ type: \'KEEPTTL\' }', () => {
        assert.deepEqual(
          parseArgs(SET, 'key', 'value', {
            expiration: {
              type: 'KEEPTTL'
            }
          }),
          ['SET', 'key', 'value', 'KEEPTTL']
        );
      });

      it('{ type: \'EX\' }', () => {
        assert.deepEqual(
          parseArgs(SET, 'key', 'value', {
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
          parseArgs(SET, 'key', 'value', {
            EX: 0
          }),
          ['SET', 'key', 'value', 'EX', '0']
        );
      });

      it('with PX (backwards compatibility)', () => {
        assert.deepEqual(
          parseArgs(SET, 'key', 'value', {
            PX: 0
          }),
          ['SET', 'key', 'value', 'PX', '0']
        );
      });

      it('with EXAT (backwards compatibility)', () => {
        assert.deepEqual(
          parseArgs(SET, 'key', 'value', {
            EXAT: 0
          }),
          ['SET', 'key', 'value', 'EXAT', '0']
        );
      });

      it('with PXAT (backwards compatibility)', () => {
        assert.deepEqual(
          parseArgs(SET, 'key', 'value', {
            PXAT: 0
          }),
          ['SET', 'key', 'value', 'PXAT', '0']
        );
      });

      it('with KEEPTTL (backwards compatibility)', () => {
        assert.deepEqual(
          parseArgs(SET, 'key', 'value', {
            KEEPTTL: true
          }),
          ['SET', 'key', 'value', 'KEEPTTL']
        );
      });
    });

    describe('condition', () => {
      it('with condition', () => {
        assert.deepEqual(
          parseArgs(SET, 'key', 'value', {
            condition: 'NX'
          }),
          ['SET', 'key', 'value', 'NX']
        );
      });

      it('with NX (backwards compatibility)', () => {
        assert.deepEqual(
          parseArgs(SET, 'key', 'value', {
            NX: true
          }),
          ['SET', 'key', 'value', 'NX']
        );
      });

      it('with XX (backwards compatibility)', () => {
        assert.deepEqual(
          parseArgs(SET, 'key', 'value', {
            XX: true
          }),
          ['SET', 'key', 'value', 'XX']
        );
      });

      it('with IFDEQ condition', () => {
        assert.deepEqual(
          parseArgs(SET, 'key', 'value', {
            condition: 'IFDEQ',
            matchValue: 'some-value'
          }),
          ['SET', 'key', 'value', 'IFDEQ', 'some-value']
        );
      });
    });

    it('with GET', () => {
      assert.deepEqual(
        parseArgs(SET, 'key', 'value', {
          GET: true
        }),
        ['SET', 'key', 'value', 'GET']
      );
    });

    it('with expiration, condition, GET', () => {
      assert.deepEqual(
        parseArgs(SET, 'key', 'value', {
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

  testUtils.testAll('set with IFEQ', async client => {
    await client.set('key{tag}', 'some-value');

    assert.equal(
      await client.set('key{tag}', 'some-value', {
        condition: 'IFEQ',
        matchValue: 'some-value'
      }),
      'OK'
    );
  }, {
    client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 4] },
    cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 4] },
  });
});
