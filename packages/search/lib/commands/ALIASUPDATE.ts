import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { SimpleStringReply, Command, RedisArgument } from '@redis/client/dist/lib/RESP/types';

export default {
  parseCommand(parser: CommandParser, alias: RedisArgument, index: RedisArgument) {
    parser.push('FT.ALIASUPDATE', alias, index);
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
