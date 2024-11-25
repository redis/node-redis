import { CommandParser } from '../client/parser';
import { RedisArgument, CommandArguments, BlobStringReply, ArrayReply, Command } from '../RESP/types';

export interface ScanCommonOptions {
  MATCH?: string;
  COUNT?: number;
}

export function parseScanArguments(
  parser: CommandParser,
  cursor: RedisArgument,
  options?: ScanOptions
) {
  parser.push(cursor);
  if (options?.MATCH) {
    parser.push('MATCH', options.MATCH);
  }

  if (options?.COUNT) {
    parser.push('COUNT', options.COUNT.toString());
  }
}

export function pushScanArguments(
  args: CommandArguments,
  cursor: RedisArgument,
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
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, cursor: RedisArgument, options?: ScanOptions) {
    parser.push('SCAN');
    parseScanArguments(parser, cursor, options);

    if (options?.TYPE) {
      parser.push('TYPE', options.TYPE);
    }
  },
  transformReply([cursor, keys]: [BlobStringReply, ArrayReply<BlobStringReply>]) {
    return {
      cursor,
      keys
    };
  }
} as const satisfies Command;
