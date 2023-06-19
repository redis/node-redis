import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import FUNCTION_LOAD from './FUNCTION_LOAD';
import { RedisClientType } from '../client';
import { NumberReply, RedisFunctions, RedisModules, RedisScripts, RespVersions } from '../RESP/types';

export const MATH_FUNCTION = {
  name: 'math',
  engine: 'LUA',
  code:
    `#!LUA name=math
    redis.register_function{
      function_name = "square",
      callback = function(keys, args) return args[1] * args[1] end,
      flags = { "no-writes" }
    }`,
  library: {
    square: {
      NAME: 'square',
      IS_READ_ONLY: true,
      NUMBER_OF_KEYS: 0,
      transformArguments(number: number) {
        return [number.toString()];
      },
      transformReply: undefined as unknown as () => NumberReply
    }
  }
};

export function loadMathFunction<
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions
>(
  client: RedisClientType<M, F, S, RESP>
) {
  return client.functionLoad(
    MATH_FUNCTION.code,
    { REPLACE: true }
  );
}

describe('FUNCTION LOAD', () => {
  testUtils.isVersionGreaterThanHook([7]);

  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        FUNCTION_LOAD.transformArguments('code'),
        ['FUNCTION', 'LOAD', 'code']
      );
    });

    it('with REPLACE', () => {
      assert.deepEqual(
        FUNCTION_LOAD.transformArguments('code', {
          REPLACE: true
        }),
        ['FUNCTION', 'LOAD', 'REPLACE', 'code']
      );
    });
  });

  testUtils.testWithClient('client.functionLoad', async client => {
    assert.equal(
      await loadMathFunction(client),
      MATH_FUNCTION.name
    );
  }, GLOBAL.SERVERS.OPEN);
});
