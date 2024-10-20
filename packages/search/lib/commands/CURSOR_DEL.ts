import { CommandParser } from '@redis/client/lib/client/parser';
import { SimpleStringReply, Command, RedisArgument, NumberReply, UnwrapReply } from '@redis/client/lib/RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, index: RedisArgument, cursorId: UnwrapReply<NumberReply>) {
    parser.push('FT.CURSOR', 'DEL', index, cursorId.toString());
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
