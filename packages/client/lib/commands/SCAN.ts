import { CommandParser } from '../client/parser';
import { RedisArgument, CommandArguments, BlobStringReply, ArrayReply, Command } from '../RESP/types';

/**
 * Common options for SCAN-type commands
 *
 * @property MATCH - Pattern to filter returned keys
 * @property COUNT - Hint for how many elements to return per iteration
 */
export interface ScanCommonOptions {
  MATCH?: string;
  COUNT?: number;
}

/**
 * Parses scan arguments for SCAN-type commands
 *
 * @param parser - The command parser
 * @param cursor - The cursor position for iteration
 * @param options - Scan options
 */
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

/**
 * Pushes scan arguments to the command arguments array
 *
 * @param args - The command arguments array
 * @param cursor - The cursor position for iteration
 * @param options - Scan options
 * @returns The updated command arguments array
 */
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

/**
 * Options for the SCAN command
 *
 * @property TYPE - Filter by value type
 */
export interface ScanOptions extends ScanCommonOptions {
  TYPE?: RedisArgument;
}

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Constructs the SCAN command
   *
   * @param parser - The command parser
   * @param cursor - The cursor position to start scanning from
   * @param options - Scan options
   * @see https://redis.io/commands/scan/
   */
  parseCommand(parser: CommandParser, cursor: RedisArgument, options?: ScanOptions) {
    parser.push('SCAN');
    parseScanArguments(parser, cursor, options);

    if (options?.TYPE) {
      parser.push('TYPE', options.TYPE);
    }
  },
  /**
   * Transforms the SCAN reply into a structured object
   *
   * @param reply - The raw reply containing cursor and keys
   * @returns Object with cursor and keys properties
   */
  transformReply([cursor, keys]: [BlobStringReply, ArrayReply<BlobStringReply>]) {
    return {
      cursor,
      keys
    };
  }
} as const satisfies Command;
