import { CommandParser } from '../client/parser';
import {
  RedisArgument,
  Command,
  BlobStringReply,
  SimpleStringReply,
  DoubleReply
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
  2: (reply: any[]): RawVembReply => {
    return {
      quantization: reply[0],
      raw: reply[1],
      l2Norm: transformDoubleReply[2](reply[2]),
      ...(reply[3] !== undefined && { quantizationRange: transformDoubleReply[2](reply[3]) })
    };
  },
  3: (reply: any[]): RawVembReply => {
    return {
      quantization: reply[0],
      raw: reply[1],
      l2Norm: reply[2],
      quantizationRange: reply[3]
    };
  },
};

export default {
  IS_READ_ONLY: true,
  /**
   * Retrieve the RAW approximate vector associated with a vector set element
   *
   * @param parser - The command parser
   * @param key - The key of the vector set
   * @param element - The name of the element to retrieve the vector for
   * @see https://redis.io/commands/vemb/
   */
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
