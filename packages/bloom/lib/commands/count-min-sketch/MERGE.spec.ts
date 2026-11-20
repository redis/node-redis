import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../../test-utils';
import MERGE from './MERGE';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';
import { BasicCommandParser } from '@redis/client/lib/client/parser';

describe('CMS.MERGE', () => {
  describe('transformArguments', () => {
    it('without WEIGHTS', () => {
      assert.deepEqual(
        parseArgs(MERGE, 'destination', ['source']),
        ['CMS.MERGE', 'destination', '1', 'source']
      );
    });

    it('with WEIGHTS', () => {
      assert.deepEqual(
        parseArgs(MERGE, 'destination', [{
          name: 'source',
          weight: 1
        }]),
        ['CMS.MERGE', 'destination', '1', 'source', 'WEIGHTS', '1']
      );
    });

    it('applies keyPrefix to the source keys', () => {
      const parser = new BasicCommandParser('prefix:');
      MERGE.parseCommand(parser, 'destination', ['source']);
      assert.deepEqual(parser.redisArgs, ['CMS.MERGE', 'prefix:destination', '1', 'prefix:source']);
      assert.deepEqual(parser.keys, ['prefix:destination', 'prefix:source']);
    });

    it('applies keyPrefix to the source keys with WEIGHTS', () => {
      const parser = new BasicCommandParser('prefix:');
      MERGE.parseCommand(parser, 'destination', [{
        name: 'source',
        weight: 1
      }]);
      assert.deepEqual(parser.redisArgs, ['CMS.MERGE', 'prefix:destination', '1', 'prefix:source', 'WEIGHTS', '1']);
      assert.deepEqual(parser.keys, ['prefix:destination', 'prefix:source']);
    });
  });

  testUtils.testWithClient('client.cms.merge', async client => {
    const [, , reply] = await Promise.all([
      client.cms.initByDim('source', 1000, 5),
      client.cms.initByDim('destination', 1000, 5),
      client.cms.merge('destination', ['source'])
    ]);

    assert.equal(reply, 'OK');
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClient('client.cms.merge with keyPrefix', async client => {
    await Promise.all([
      client.cms.initByDim('source', 1000, 5),
      client.cms.initByDim('destination', 1000, 5)
    ]);
    await client.cms.incrBy('source', { item: 'item', incrementBy: 3 });

    assert.equal(await client.cms.merge('destination', ['source']), 'OK');
    assert.deepEqual(await client.cms.query('destination', 'item'), [3]);
  }, {
    ...GLOBAL.SERVERS.OPEN,
    clientOptions: {
      ...GLOBAL.SERVERS.OPEN.clientOptions,
      keyPrefix: 'prefix:'
    }
  });
});
