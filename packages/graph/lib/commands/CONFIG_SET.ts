import { RedisArgument, SimpleStringReply, Command } from '@redis/client/dist/lib/RESP/types';
import { CommandParser } from '@redis/client/dist/lib/client/parser';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, configKey: RedisArgument, value: number) {
    parser.pushVariadic(['GRAPH.CONFIG', 'SET', configKey, value.toString()]);
  },
  transformArguments(configKey: RedisArgument, value: number) { return [] },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
