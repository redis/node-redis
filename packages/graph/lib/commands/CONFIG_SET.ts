import { RedisArgument, SimpleStringReply, Command } from '@redis/client/lib/RESP/types';
import { CommandParser } from '@redis/client/lib/client/parser';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, configKey: RedisArgument, value: number) {
    parser.push('GRAPH.CONFIG', 'SET', configKey, value.toString());
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
