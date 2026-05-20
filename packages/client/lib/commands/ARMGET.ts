import { CommandParser } from '../client/parser';
import { RedisArgument, ArrayReply, BlobStringReply, NullReply, Command } from '../RESP/types';

export default {
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument, indices: number | string | Array<number | string>) {
    parser.push('ARMGET');
    parser.pushKey(key);
    if (Array.isArray(indices)) {
      for (const i of indices) parser.push(i.toString());
    } else {
      parser.push(indices.toString());
    }
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply | NullReply>
} as const satisfies Command;
