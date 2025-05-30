import { CommandParser } from '../client/parser';
import { RedisArgument, ArrayReply, BlobStringReply, Command } from '../RESP/types';
import { ScanCommonOptions, parseScanArguments } from './SCAN';
import { transformSortedSetReply } from './generic-transformers';

export interface HScanEntry {
  field: BlobStringReply;
  value: BlobStringReply;
}

export default {
  IS_READ_ONLY: true,
  /**
   * Incrementally iterates over a sorted set.
   * @param parser - The Redis command parser.
   * @param key - Key of the sorted set.
   * @param cursor - Cursor position to start the scan from.
   * @param options - Optional scan parameters (COUNT, MATCH, TYPE).
   */
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    cursor: RedisArgument,
    options?: ScanCommonOptions
  ) {
    parser.push('ZSCAN');
    parser.pushKey(key);
    parseScanArguments(parser, cursor, options);
  },
  transformReply([cursor, rawMembers]: [BlobStringReply, ArrayReply<BlobStringReply>]) {
    return {
      cursor,
      members: transformSortedSetReply[2](rawMembers)
    };
  }
} as const satisfies Command;
