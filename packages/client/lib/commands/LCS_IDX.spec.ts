import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import LCS_IDX from './LCS_IDX';
import { parseArgs } from './generic-transformers';

describe('LCS IDX', () => {
  testUtils.isVersionGreaterThanHook([7]);

  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(LCS_IDX, '1', '2'),
      ['LCS', '1', '2', 'IDX']
    );
  });

  testUtils.testWithClient('client.lcsIdx', async client => {
    const [, reply] = await Promise.all([
      client.mSet({
        '1': 'abc',
        '2': 'bc'
      }),
      client.lcsIdx('1', '2')
    ]);

    assert.deepEqual(
      reply,
      {
        matches: [
          [[1, 2], [0, 1]]
        ],
        len: 2
      }
    );
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClient('client.lcsIdx RESP3', async client => {
    const [, reply] = await Promise.all([
      client.mSet({
        '1': 'abc',
        '2': 'bc'
      }),
      client.lcsIdx('1', '2')
    ]);

    assert.equal(reply.len, 2);
    assert.ok(Array.isArray(reply.matches));
    assert.equal(reply.matches.length, 1);
    assert.deepEqual([...reply.matches[0][0]], [1, 2]);
    assert.deepEqual([...reply.matches[0][1]], [0, 1]);
  }, GLOBAL.SERVERS.OPEN);
});
