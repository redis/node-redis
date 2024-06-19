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
    destinationSide: ListSide,
    timeout: number
  ) {
    parser.push('BLMOVE');
    parser.pushKeys([source, destination]);
    parser.pushVariadic([sourceSide, destinationSide, timeout.toString()])
  },
  transformArguments(
    source: RedisArgument,
    destination: RedisArgument,
    sourceSide: ListSide,
    destinationSide: ListSide,
    timeout: number
  ) { return [] },
  transformReply: undefined as unknown as () => BlobStringReply | NullReply
} as const satisfies Command;
