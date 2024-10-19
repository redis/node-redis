import { RedisArgument, TuplesReply, ArrayReply, BlobStringReply, NumberReply, Command } from '@redis/client/lib/RESP/types';
import { CommandParser } from '@redis/client/lib/client/parser';

type ConfigItemReply = TuplesReply<[
  configKey: BlobStringReply,
  value: NumberReply
]>;

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, configKey: RedisArgument) {
    parser.push('GRAPH.CONFIG', 'GET', configKey);
  },
  transformReply: undefined as unknown as () => ConfigItemReply | ArrayReply<ConfigItemReply>
} as const satisfies Command;
