import { CommandParser } from '../client/parser';
import { RedisArgument, Command } from '../RESP/types';
import { ListSide } from './generic-transformers';
import LMOVEM, { LMoveMOptions, parseLMoveMOptions } from './LMOVEM';

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
    parseLMoveMOptions(parser, options);
  },
  transformReply: LMOVEM.transformReply
} as const satisfies Command;
