import { CommandParser } from '../client/parser';
import { RedisArgument, Command } from '../RESP/types';
import { ListSide } from './generic-transformers';
import LMOVEM, { LMoveMOptions } from './LMOVEM';

export default {
  IS_READ_ONLY: false,
  parseCommand(
    parser: CommandParser,
    source: RedisArgument,
    destination: RedisArgument,
    sourceSide: ListSide,
    destinationSide: ListSide,
    timeout: number,
    options?: LMoveMOptions
  ) {
    parser.push('BLMOVEM');
    parser.pushKeys([source, destination]);
    parser.push(sourceSide, destinationSide, timeout.toString());

    if (options) {
      if ('EXACTLY' in options) {
        parser.push('EXACTLY', options.EXACTLY.toString());
      } else {
        parser.push('COUNT', options.COUNT.toString());
      }

      if (options.ORDER !== undefined) {
        parser.push(options.ORDER);
      }
    }
  },
  transformReply: LMOVEM.transformReply
} as const satisfies Command;
