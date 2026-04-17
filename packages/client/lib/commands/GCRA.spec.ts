import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import GCRA from './GCRA';
import { parseArgs } from './generic-transformers';

describe('GCRA', () => {
  testUtils.isVersionGreaterThanHook([8, 8]);

  describe('transformArguments', () => {
    it('with required arguments', () => {
      assert.deepEqual(
        parseArgs(GCRA, 'key', 15, 30, 60),
        ['GCRA', 'key', '15', '30', '60']
      );
    });

    it('with a fractional period', () => {
      assert.deepEqual(
        parseArgs(GCRA, 'key', 15, 30, 0.5),
        ['GCRA', 'key', '15', '30', '0.5']
      );
    });

    it('with TOKENS', () => {
      assert.deepEqual(
        parseArgs(GCRA, 'key', 15, 30, 60, 3),
        ['GCRA', 'key', '15', '30', '60', 'TOKENS', '3']
      );
    });
  });

  function assertReplyShape(reply: {
    limited: boolean;
    maxRequests: number;
    availableRequests: number;
    retryAfter: number;
    fullBurstAfter: number;
  }, expectedMaxRequests: number) {
    assert.ok(reply.limited === true || reply.limited === false);
    assert.equal(reply.maxRequests, expectedMaxRequests);
    assert.ok(reply.availableRequests >= 0);
    assert.ok(reply.retryAfter >= -1);
    assert.ok(reply.fullBurstAfter >= 0);
  }

  testUtils.testWithClient('gcra allows one request then limits the next with zero burst', async client => {
    const first = await client.gcra('gcra:single-token', 0, 1, 1);
    const second = await client.gcra('gcra:single-token', 0, 1, 1);

    assertReplyShape(first, 1);
    assertReplyShape(second, 1);
    assert.notEqual(first.limited, second.limited);

    assert.ok(first.retryAfter === -1 || second.retryAfter === -1);
    assert.ok(first.retryAfter >= 0 || second.retryAfter >= 0);
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClient('gcra supports weighted requests using TOKENS', async client => {
    const key = 'gcra:weighted';

    const first = await client.gcra(key, 10, 10, 1, 10);
    const second = await client.gcra(key, 10, 10, 1, 10);

    assertReplyShape(first, 11);
    assertReplyShape(second, 11);
    assert.notEqual(first.limited, second.limited);
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClient('gcra returns the same reply shape on RESP3', async client => {
    const first = await client.gcra('gcra:resp3', 0, 1, 1);
    const second = await client.gcra('gcra:resp3', 0, 1, 1);

    assertReplyShape(first, 1);
    assertReplyShape(second, 1);
    assert.notEqual(first.limited, second.limited);
  },  GLOBAL.SERVERS.OPEN_RESP_3);
});
