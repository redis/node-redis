import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SPOP_COUNT from './SPOP_COUNT';
import { BasicCommandParser } from '../client/parser';

describe('SPOP_COUNT', () => {
  it('transformArguments', () => {
    const parser = new BasicCommandParser();
    SPOP_COUNT.parseCommand(parser, 'key', 1);
    assert.deepEqual(
      parser.redisArgs,
      ['SPOP', 'key', '1']
    );
  });

  testUtils.testAll('sPopCount', async client => {

    assert.deepEqual(
      await client.sPopCount('key', 1),
      []
    );

    await Promise.all([
      client.sAdd('key', 'member'),
      client.sAdd('key', 'member2'),
      client.sAdd('key', 'member3')
    ])

    assert.deepEqual(
      (await client.sPopCount('key', 3)).length,
      3
    );

  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
