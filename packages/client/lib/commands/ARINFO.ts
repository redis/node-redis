import { CommandParser } from '../client/parser';
import { RedisArgument, MapReply, BlobStringReply, NumberReply, DoubleReply, ArrayReply, UnwrapReply, Command } from '../RESP/types';
import { transformDoubleReply, transformTuplesReply } from './generic-transformers';

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
    2: (reply: ArrayReply<BlobStringReply | NumberReply>, preserve, typeMapping) => {
      const inferred = reply as unknown as UnwrapReply<typeof reply>;

      for (let i = 0; i < inferred.length; i += 2) {
        switch (inferred[i].toString()) {
          case 'avg-dense-size':
          case 'avg-dense-fill':
          case 'avg-sparse-size':
            inferred[i + 1] = transformDoubleReply[2](inferred[i + 1] as BlobStringReply, preserve, typeMapping) as unknown as BlobStringReply;
            break;
        }
      }

      return transformTuplesReply(reply as unknown as ArrayReply<BlobStringReply>, preserve, typeMapping) as unknown as ArInfoReply;
    },
    3: undefined as unknown as () => ArInfoReply
  }
} as const satisfies Command;
