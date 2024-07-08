import { RedisArgument, BlobStringReply, NullReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';
import { ListSide } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  parseCommand(
    parser: CommandParser,
    source: RedisArgument,
    destination: RedisArgument,
    sourceSide: ListSide,
    destinationSide: ListSide
  ) {
    parser.push('LMOVE');
    parser.pushKeys([source, destination]);
    parser.pushVariadic([sourceSide, destinationSide]);
  },
  transformArguments(
    source: RedisArgument,
    destination: RedisArgument,
    sourceSide: ListSide,
    destinationSide: ListSide
  ) { return [] },
  transformReply: undefined as unknown as () => BlobStringReply | NullReply
} as const satisfies Command;
