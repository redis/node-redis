import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { SimpleStringReply, Command, RedisArgument, NumberReply, UnwrapReply } from '@redis/client/dist/lib/RESP/types';

export default {
  parseCommand(parser: CommandParser, index: RedisArgument, cursorId: UnwrapReply<NumberReply>) {
    parser.push('FT.CURSOR', 'DEL', index, cursorId.toString());
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
