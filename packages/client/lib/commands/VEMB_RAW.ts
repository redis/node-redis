import { CommandParser } from '../client/parser';
import {
  RedisArgument,
  Command,
  BlobStringReply,
  SimpleStringReply,
  DoubleReply,
  TypeMapping
} from '../RESP/types';
import { transformDoubleReply } from './generic-transformers';
import VEMB from './VEMB';

type RawVembReply = {
  quantization: SimpleStringReply;
  raw: BlobStringReply;
  l2Norm: DoubleReply;
  quantizationRange?: DoubleReply;
};

const transformRawVembReply = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- matches TransformReply contract
  2: (reply: [SimpleStringReply, BlobStringReply, BlobStringReply, BlobStringReply?], preserve?: any, typeMapping?: TypeMapping): RawVembReply => {
    return {
      quantization: reply[0],
      raw: reply[1],
      l2Norm: transformDoubleReply[2](reply[2], preserve, typeMapping),
      ...(reply[3] !== undefined && { quantizationRange: transformDoubleReply[2](reply[3], preserve, typeMapping) })
    };
  },
  3: (reply: [SimpleStringReply, BlobStringReply, DoubleReply, DoubleReply?]): RawVembReply => {
    return {
      quantization: reply[0],
      raw: reply[1],
      l2Norm: reply[2],
      quantizationRange: reply[3]
    };
  },
};

export default {
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    element: RedisArgument
  ) {
    VEMB.parseCommand(parser, key, element);
    parser.push('RAW');
  },
  transformReply: transformRawVembReply
} as const satisfies Command;
