import { CommandArguments, RedisArgument, BlobStringReply, ArrayReply, Command } from '../RESP/types';

export interface ScanCommonOptions {
  MATCH?: string;
  COUNT?: number;
}

export function pushScanArguments(
  args: CommandArguments,
  cursor: number,
  options?: ScanOptions
): CommandArguments {
  args.push(cursor.toString());

  if (options?.MATCH) {
    args.push('MATCH', options.MATCH);
  }

  if (options?.COUNT) {
    args.push('COUNT', options.COUNT.toString());
  }

  return args;
}

export interface ScanOptions extends ScanCommonOptions {
  TYPE?: RedisArgument;
}

export default {
  IS_READ_ONLY: true,
  transformArguments(cursor: number, options?: ScanOptions) {
    const args = pushScanArguments(['SCAN'], cursor, options);

    if (options?.TYPE) {
      args.push('TYPE', options.TYPE);
    }

    return args;
  },
  transformReply([cursor, keys]: [BlobStringReply, ArrayReply<BlobStringReply>]) {
    return {
      cursor: Number(cursor),
      keys
    };
  }
} as const satisfies Command;
