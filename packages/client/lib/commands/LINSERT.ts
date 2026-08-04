import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';

type LInsertPosition = 'BEFORE' | 'AFTER';

export default {
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    position: LInsertPosition,
    pivot: RedisArgument,
    element: RedisArgument
  ) {
    parser.push('LINSERT');
    parser.pushKey(key);
    parser.push(position, pivot, element);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
