import { CommandParser } from '../client/parser';
import { RedisArgument, BlobStringReply, NullReply, Command } from '../RESP/types';
import { ListSide } from './generic-transformers';

export default {
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
    parser.push(sourceSide, destinationSide);
  },
  transformReply: undefined as unknown as () => BlobStringReply | NullReply
} as const satisfies Command;
