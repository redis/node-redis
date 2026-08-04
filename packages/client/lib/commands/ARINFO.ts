import { CommandParser } from '../client/parser';
import { RedisArgument, MapReply, BlobStringReply, NumberReply, DoubleReply, ArrayReply, Command } from '../RESP/types';
import { transformTuplesReply } from './generic-transformers';

export interface ArInfoOptions {
  FULL?: boolean;
}

export type ArInfoReply = MapReply<BlobStringReply, NumberReply | DoubleReply>;

export default {
  parseCommand(parser: CommandParser, key: RedisArgument, options?: ArInfoOptions) {
    parser.push('ARINFO');
    parser.pushKey(key);
    if (options?.FULL) {
      parser.push('FULL');
    }
  },
  transformReply: {
    2: (reply: ArrayReply<BlobStringReply | NumberReply>, preserve, typeMapping) =>
      transformTuplesReply(reply as unknown as ArrayReply<BlobStringReply>, preserve, typeMapping) as unknown as ArInfoReply,
    3: undefined as unknown as () => ArInfoReply
  }
} as const satisfies Command;
