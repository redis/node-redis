import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

type LInsertPosition = 'BEFORE' | 'AFTER';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    position: LInsertPosition,
    pivot: RedisArgument,
    element: RedisArgument
  ) {
    parser.push('LINSERT');
    parser.pushKey(key);
    parser.pushVariadic([position, pivot, element]);
  },
  transformArguments(
    key: RedisArgument,
    position: LInsertPosition,
    pivot: RedisArgument,
    element: RedisArgument
  ) { return [] },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
