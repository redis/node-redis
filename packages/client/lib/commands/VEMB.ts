import { CommandParser } from '../client/parser';
import { RedisArgument, Command, ArrayReply, BlobStringReply, DoubleReply, NullReply, TypeMapping } from '../RESP/types';
import { transformDoubleArrayReply } from './generic-transformers';

export default {
  parseCommand(parser: CommandParser, key: RedisArgument, element: RedisArgument) {
    parser.push('VEMB');
    parser.pushKey(key);
    parser.push(element);
  },
  transformReply: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- matches TransformReply contract
    2: (reply: Array<BlobStringReply> | null, preserve?: any, typeMapping?: TypeMapping) => {
      if (reply === null) return null;

      return transformDoubleArrayReply[2](reply, preserve, typeMapping);
    },
    3: undefined as unknown as () => ArrayReply<DoubleReply> | NullReply
  }
} as const satisfies Command;
