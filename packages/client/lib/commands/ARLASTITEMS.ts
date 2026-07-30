import { CommandParser } from '../client/parser';
import { RedisArgument, ArrayReply, BlobStringReply, NullReply, Command } from '../RESP/types';

export interface ArLastItemsOptions {
  REV?: boolean;
}

export default {
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    count: number,
    options?: ArLastItemsOptions
  ) {
    parser.push('ARLASTITEMS');
    parser.pushKey(key);
    parser.push(count.toString());

    if (options?.REV) {
      parser.push('REV');
    }
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply | NullReply>
} as const satisfies Command;
