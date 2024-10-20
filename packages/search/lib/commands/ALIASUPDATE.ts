import { CommandParser } from '@redis/client/lib/client/parser';
import { SimpleStringReply, Command, RedisArgument } from '@redis/client/lib/RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, alias: RedisArgument, index: RedisArgument) {
    parser.push('FT.ALIASUPDATE', alias, index);
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
