import { RedisArgument, TuplesReply, ArrayReply, BlobStringReply, NumberReply, Command } from '@redis/client/dist/lib/RESP/types';

type ConfigItemReply = TuplesReply<[
  configKey: BlobStringReply,
  value: NumberReply
]>;

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments(configKey: RedisArgument) {
    return ['GRAPH.CONFIG', 'GET', configKey];
  },
  transformReply: undefined as unknown as () => ConfigItemReply | ArrayReply<ConfigItemReply>
} as const satisfies Command;
