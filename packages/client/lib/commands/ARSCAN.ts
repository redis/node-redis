import { CommandParser } from '../client/parser';
import { RedisArgument, ArrayReply, TuplesReply, NumberReply, BlobStringReply, UnwrapReply, Command } from '../RESP/types';

export interface ArScanOptions {
  LIMIT?: number;
}

export type ArScanReply = Array<{
  index: NumberReply;
  value: BlobStringReply;
}>;

export default {
  IS_READ_ONLY: true,
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    start: number | string,
    end: number | string,
    options?: ArScanOptions
  ) {
    parser.push('ARSCAN');
    parser.pushKey(key);
    parser.push(start.toString(), end.toString());

    if (options?.LIMIT !== undefined) {
      parser.push('LIMIT', options.LIMIT.toString());
    }
  },
  transformReply: (reply: ArrayReply<TuplesReply<[index: NumberReply, value: BlobStringReply]>>) => {
    const unwrapped = reply as unknown as UnwrapReply<typeof reply>;
    return unwrapped.map(pair => {
      const [index, value] = pair as unknown as UnwrapReply<typeof pair>;
      return { index, value };
    }) satisfies ArScanReply;
  }
} as const satisfies Command;
