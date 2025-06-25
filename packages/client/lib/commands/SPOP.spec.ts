import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SPOP from './SPOP';
import { BasicCommandParser } from '../client/parser';

describe('SPOP', () => {
  it('transformArguments', () => {
    const parser = new BasicCommandParser();
    SPOP.parseCommand(parser, 'key');
    assert.deepEqual(
      parser.redisArgs,
      ['SPOP', 'key']
    );
  });

  testUtils.testAll('sPop', async client => {
    assert.equal(
      await client.sPop('key'),
      null
    );

    await client.sAdd('key', 'member');

    assert.equal(
      await client.sPop('key'),
      'member'
    );

    assert.equal(
      await client.sPop('key'),
      null
    );

  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
