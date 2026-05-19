import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';

export type ArDelRangeRange = [start: number | string, end: number | string];

export default {
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    ranges: Array<ArDelRangeRange>
  ) {
    parser.push('ARDELRANGE');
    parser.pushKey(key);

    for (const [start, end] of ranges) {
      parser.push(start.toString(), end.toString());
    }
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
