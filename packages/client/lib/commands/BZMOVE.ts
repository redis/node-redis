import { CommandParser } from '../client/parser';
import { RedisArgument, Command } from '../RESP/types';
import { SortedSetSide } from './generic-transformers';
import ZMOVE, { ZMoveOptions } from './ZMOVE';

export default {
  parseCommand(
    parser: CommandParser,
    source: RedisArgument,
    destination: RedisArgument,
    side: SortedSetSide,
    timeout: number,
    options?: ZMoveOptions
  ) {
    parser.push('BZMOVE');
    parser.pushKey(source);
    parser.pushKey(destination);
    parser.push(side, timeout.toString());

    if (options?.COUNT !== undefined) {
      parser.push('COUNT', options.COUNT.toString());
    }
  },
  transformReply: ZMOVE.transformReply
} as const satisfies Command;
