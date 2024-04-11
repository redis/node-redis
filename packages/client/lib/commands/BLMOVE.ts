import { RedisArgument, BlobStringReply, NullReply, Command } from '../RESP/types';
import { ListSide } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments(
    source: RedisArgument,
    destination: RedisArgument,
    sourceSide: ListSide,
    destinationSide: ListSide,
    timeout: number
  ) {
    return [
      'BLMOVE',
      source,
      destination,
      sourceSide,
      destinationSide,
      timeout.toString()
    ];
  },
  transformReply: undefined as unknown as () => BlobStringReply | NullReply
} as const satisfies Command;
