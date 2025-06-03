import { CommandParser } from '../client/parser';
import { RedisArgument, BlobStringReply, Command } from '../RESP/types';
import { ScanCommonOptions, parseScanArguments } from './SCAN';

export interface HScanEntry {
  field: BlobStringReply;
  value: BlobStringReply;
}

export default {
  IS_READ_ONLY: true,
  /**
   * Constructs the HSCAN command
   * 
   * @param parser - The command parser
   * @param key - The key of the hash to scan
   * @param cursor - The cursor position to start scanning from
   * @param options - Options for the scan (COUNT, MATCH, TYPE)
   * @see https://redis.io/commands/hscan/
   */
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    cursor: RedisArgument,
    options?: ScanCommonOptions
  ) {
    parser.push('HSCAN');
    parser.pushKey(key);
    parseScanArguments(parser, cursor, options);
  },
  transformReply([cursor, rawEntries]: [BlobStringReply, Array<BlobStringReply>]) {
    const entries = [];
    let i = 0;
    while (i < rawEntries.length) {
      entries.push({
        field: rawEntries[i++],
        value: rawEntries[i++]
      } satisfies HScanEntry);
    }

    return {
      cursor,
      entries
    };
  }
} as const satisfies Command;
