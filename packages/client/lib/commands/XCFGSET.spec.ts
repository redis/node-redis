import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import XCFGSET from './XCFGSET';
import { parseArgs } from './generic-transformers';

describe('XCFGSET', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(XCFGSET, 'mystream'),
        ['XCFGSET', 'mystream']
      );
    });

    it('with IDMP_DURATION', () => {
      assert.deepEqual(
        parseArgs(XCFGSET, 'mystream', {
          IDMP_DURATION: 120
        }),
        ['XCFGSET', 'mystream', 'IDMP-DURATION', '120']
      );
    });

    it('with IDMP_MAXSIZE', () => {
      assert.deepEqual(
        parseArgs(XCFGSET, 'mystream', {
          IDMP_MAXSIZE: 5000
        }),
        ['XCFGSET', 'mystream', 'IDMP-MAXSIZE', '5000']
      );
    });

    it('with IDMP_DURATION and IDMP_MAXSIZE', () => {
      assert.deepEqual(
        parseArgs(XCFGSET, 'mystream', {
          IDMP_DURATION: 120,
          IDMP_MAXSIZE: 5000
        }),
        ['XCFGSET', 'mystream', 'IDMP-DURATION', '120', 'IDMP-MAXSIZE', '5000']
      );
    });
  });

  testUtils.testAll('xCfgSet with IDMP_DURATION', async client => {
    await client.xAdd('key', '*', { field: 'value' });

    assert.equal(
      await client.xCfgSet('key', {
        IDMP_DURATION: 60
      }),
      'OK'
    );
  }, {
    client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 6] },
    cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 6] }
  });

  testUtils.testAll('xCfgSet with IDMP_MAXSIZE', async client => {
    await client.xAdd('key', '*', { field: 'value' });

    assert.equal(
      await client.xCfgSet('key', {
        IDMP_MAXSIZE: 10000
      }),
      'OK'
    );
  }, {
    client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 6] },
    cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 6] }
  });

  testUtils.testAll('xCfgSet with IDMP_DURATION and IDMP_MAXSIZE', async client => {
    await client.xAdd('key', '*', { field: 'value' });

    assert.equal(
      await client.xCfgSet('key', {
        IDMP_DURATION: 120,
        IDMP_MAXSIZE: 5000
      }),
      'OK'
    );
  }, {
    client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 6] },
    cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 6] }
  });
});

