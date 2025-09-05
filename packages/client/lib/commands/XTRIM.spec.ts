import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import XTRIM from './XTRIM';
import { parseArgs } from './generic-transformers';
import { STREAM_DELETION_POLICY } from './common-stream.types';

describe('XTRIM', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(XTRIM, 'key', 'MAXLEN', 1),
        ['XTRIM', 'key', 'MAXLEN', '1']
      );
    });

    it('simple - MINID', () => {
      assert.deepEqual(
        parseArgs(XTRIM, 'key', 'MINID', 123),
        ['XTRIM', 'key', 'MINID', '123']
      );

      assert.deepEqual(
        parseArgs(XTRIM, 'key', 'MINID', '0-0'),
        ['XTRIM', 'key', 'MINID', '0-0']
      );
    });

    it('with strategyModifier', () => {
      assert.deepEqual(
        parseArgs(XTRIM, 'key', 'MAXLEN', 1, {
          strategyModifier: '='
        }),
        ['XTRIM', 'key', 'MAXLEN', '=', '1']
      );
    });

    it('with LIMIT', () => {
      assert.deepEqual(
        parseArgs(XTRIM, 'key', 'MAXLEN', 1, {
          LIMIT: 1
        }),
        ['XTRIM', 'key', 'MAXLEN', '1', 'LIMIT', '1']
      );
    });

    it('with strategyModifier, LIMIT', () => {
      assert.deepEqual(
        parseArgs(XTRIM, 'key', 'MAXLEN', 1, {
          strategyModifier: '=',
          LIMIT: 1
        }),
        ['XTRIM', 'key', 'MAXLEN', '=', '1', 'LIMIT', '1']
      );
    });

    it('with policy', () => {
      assert.deepEqual(
        parseArgs(XTRIM, 'key', 'MAXLEN', 1, {
          policy: STREAM_DELETION_POLICY.DELREF
        }),
        ['XTRIM', 'key', 'MAXLEN', '1', 'DELREF']
      );
    });

    it('with all options', () => {
      assert.deepEqual(
        parseArgs(XTRIM, 'key', 'MAXLEN', 1, {
          strategyModifier: '~',
          LIMIT: 100,
          policy: STREAM_DELETION_POLICY.ACKED
        }),
        ['XTRIM', 'key', 'MAXLEN', '~', '1', 'LIMIT', '100', 'ACKED']
      );
    });
  });

  testUtils.testAll('xTrim with MAXLEN', async client => {
    assert.equal(
      typeof await client.xTrim('key', 'MAXLEN', 1),
      'number'
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN,
  });

  testUtils.testAll('xTrim with MINID', async client => {
    assert.equal(
      typeof await client.xTrim('key', 'MINID', 1),
      'number'
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN,
  });

  testUtils.testAll('xTrim with string MINID', async client => {
    assert.equal(
      typeof await client.xTrim('key', 'MINID', '0-0'),
      'number'
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN,
  });

  testUtils.testAll(
    'xTrim with LIMIT',
    async (client) => {
      assert.equal(
        typeof await client.xTrim('{tag}key', 'MAXLEN', 1000, {
          strategyModifier: '~',
          LIMIT: 10
        }),
        'number'
      );
    },
    {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN,
    }
  );

  testUtils.testAll(
    'xTrim with policy',
    async (client) => {
      assert.equal(
        typeof await client.xTrim('{tag}key', 'MAXLEN', 0, {
          policy: STREAM_DELETION_POLICY.DELREF
        }),
        'number'
      );
    },
    {
      client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 2] },
      cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 2] },
    }
  );

  testUtils.testAll(
    'xTrim with all options',
    async (client) => {
      assert.equal(
        typeof await client.xTrim('{tag}key', 'MINID', 0, {
          strategyModifier: '~',
          LIMIT: 10,
          policy: STREAM_DELETION_POLICY.KEEPREF
        }),
        'number'
      );
    },
    {
      client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 2] },
      cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 2] },
    }
  );
});
