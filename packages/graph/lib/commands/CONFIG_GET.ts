import { RedisArgument, TuplesReply, ArrayReply, BlobStringReply, NumberReply, Command } from '@redis/client/dist/lib/RESP/types';
import { CommandParser } from '@redis/client/dist/lib/client/parser';

type ConfigItemReply = TuplesReply<[
  configKey: BlobStringReply,
  value: NumberReply
]>;

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, configKey: RedisArgument) {
    parser.pushVariadic(['GRAPH.CONFIG', 'GET', configKey]);
  },
  transformArguments(configKey: RedisArgument) { return [] },
  transformReply: undefined as unknown as () => ConfigItemReply | ArrayReply<ConfigItemReply>
} as const satisfies Command;
