import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, SimpleStringReply, Command } from '@redis/client/dist/lib/RESP/types';

export default {
  parseCommand(parser: CommandParser, alias: RedisArgument, index: RedisArgument) {
    parser.push('FT.ALIASADD', alias, index);
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
