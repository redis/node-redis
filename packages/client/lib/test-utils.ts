import TestUtils from '@redis/test-utils';
import { SinonSpy } from 'sinon';
import { setTimeout } from 'node:timers/promises';
import { CredentialsProvider } from './authx';
import { Command, NumberReply } from './RESP/types';
import { BasicCommandParser, CommandParser } from './client/parser';
import { defineScript } from './lua-script';
import RedisBloomModules from '@redis/bloom';
const utils = TestUtils.createFromConfig({
  dockerImageName: 'redislabs/client-libs-test',
  dockerImageVersionArgument: 'redis-version',
  defaultDockerVersion: '8.4-RC1-pre.2'
});

export default utils;

export const DEBUG_MODE_ARGS = utils.isVersionGreaterThan([7]) ?
  ['--enable-debug-command', 'yes'] :
  [];

const asyncBasicAuthCredentialsProvider: CredentialsProvider =
  {
    type: 'async-credentials-provider',
    credentials: async () => ({ password: 'password' })
  } as const;

const streamingCredentialsProvider: CredentialsProvider =
  {
    type: 'streaming-credentials-provider',

    subscribe : (observable) => ( Promise.resolve([
     { password: 'password' },
      {
       dispose: () => {
          console.log('disposing credentials provider subscription');
        }
      }
    ])),

    onReAuthenticationError: (error) => {
      console.error('re-authentication error', error);
    }

  } as const;

const SQUARE_SCRIPT = defineScript({
  SCRIPT:
    `local number = redis.call('GET', KEYS[1])
    return number * number`,
  NUMBER_OF_KEYS: 1,
  FIRST_KEY_INDEX: 0,
  parseCommand(parser: CommandParser, key: string) {
    parser.pushKey(key);
  },
  transformReply: undefined as unknown as () => NumberReply
});

export const MATH_FUNCTION = {
  name: 'math',
  engine: 'LUA',
  code:
    `#!LUA name=math
    redis.register_function {
      function_name = "square",
      callback = function(keys, args)
        local number = redis.call('GET', keys[1])
        return number * number
      end,
      flags = { "no-writes" }
    }`,
  library: {
    square: {
      NAME: 'square',
      IS_READ_ONLY: true,
      NUMBER_OF_KEYS: 1,
      FIRST_KEY_INDEX: 0,
      parseCommand(parser: CommandParser, key: string) {
        parser.pushKey(key);
      },
      transformReply: undefined as unknown as () => NumberReply
    }
  }
};

export const GLOBAL = {
  SERVERS: {
    OPEN: {
      serverArguments: [...DEBUG_MODE_ARGS]
    },
    PASSWORD: {
      serverArguments: ['--requirepass', 'password', ...DEBUG_MODE_ARGS],
      clientOptions: {
        password: 'password'
      }
    },
    OPEN_RESP_3: {
      serverArguments: [...DEBUG_MODE_ARGS],
      clientOptions: {
        RESP: 3,
      }
    },
    ASYNC_BASIC_AUTH: {
      serverArguments: ['--requirepass', 'password', ...DEBUG_MODE_ARGS],
      clientOptions: {
        credentialsProvider: asyncBasicAuthCredentialsProvider
      }
    },
    STREAMING_AUTH: {
      serverArguments: ['--requirepass', 'password', ...DEBUG_MODE_ARGS],
      clientOptions: {
        credentialsProvider: streamingCredentialsProvider
      }
    }
  },
  CLUSTERS: {
    OPEN: {
      serverArguments: [...DEBUG_MODE_ARGS]
    },
    PASSWORD: {
      serverArguments: ['--requirepass', 'password', ...DEBUG_MODE_ARGS],
      clusterConfiguration: {
        defaults: {
          password: 'password'
        }
      }
    },
    WITH_REPLICAS: {
      serverArguments: [...DEBUG_MODE_ARGS],
      numberOfMasters: 2,
      numberOfReplicas: 1,
      clusterConfiguration: {
        useReplicas: true
      }
    }
  },
  SENTINEL: {
    OPEN: {
      serverArguments: [...DEBUG_MODE_ARGS],
    },
    PASSWORD: {
      serverArguments: ['--requirepass', 'test_password', ...DEBUG_MODE_ARGS],
    },
    WITH_SCRIPT: {
      serverArguments: [...DEBUG_MODE_ARGS],
      scripts: {
        square: SQUARE_SCRIPT,
      },
    },
    WITH_FUNCTION: {
      serverArguments: [...DEBUG_MODE_ARGS],
      functions: {
        math: MATH_FUNCTION.library,
      },
    },
    WITH_MODULE: {
      serverArguments: [...DEBUG_MODE_ARGS],
      modules: RedisBloomModules,
    },
    WITH_REPLICA_POOL_SIZE_1: {
      serverArguments: [...DEBUG_MODE_ARGS],
      replicaPoolSize: 1,
    },
    WITH_RESERVE_CLIENT_MASTER_POOL_SIZE_2: {
      serverArguments: [...DEBUG_MODE_ARGS],
      masterPoolSize: 2,
      reserveClient: true,
    },
    WITH_MASTER_POOL_SIZE_2: {
      serverArguments: [...DEBUG_MODE_ARGS],
      masterPoolSize: 2,
    }
  }
};

export async function waitTillBeenCalled(spy: SinonSpy): Promise<void> {
  const start = process.hrtime.bigint(),
    calls = spy.callCount;

  do {
    if (process.hrtime.bigint() - start > 1_000_000_000) {
      throw new Error('Waiting for more than 1 second');
    }

    await setTimeout(50);
  } while (spy.callCount === calls);
}

export const BLOCKING_MIN_VALUE = (
  utils.isVersionGreaterThan([7]) ? Number.MIN_VALUE :
  utils.isVersionGreaterThan([6]) ? 0.01 :
  1
);

export function parseFirstKey(command: Command, ...args: Array<any>) {
  const parser = new BasicCommandParser();
  command.parseCommand!(parser, ...args);
  return parser.firstKey;
}
