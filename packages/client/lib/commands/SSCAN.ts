import { CommandParser } from '../client/parser';
import { RedisArgument, BlobStringReply, Command } from '../RESP/types';
import { ScanCommonOptions, parseScanArguments} from './SCAN';

export default {
  IS_READ_ONLY: true,
  /**
   * Constructs the SSCAN command to incrementally iterate over elements in a set
   *
   * @param parser - The command parser
   * @param key - The key of the set to scan
   * @param cursor - The cursor position to start scanning from
   * @param options - Optional scanning parameters (COUNT and MATCH)
   * @returns Iterator containing cursor position and matching members
   * @see https://redis.io/commands/sscan/
   */
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    cursor: RedisArgument,
    options?: ScanCommonOptions
  ) {
    parser.push('SSCAN');
    parser.pushKey(key);
    parseScanArguments(parser, cursor, options);
  },
  /**
   * Transforms the SSCAN reply into a cursor result object
   * 
   * @param cursor - The next cursor position
   * @param members - Array of matching set members
   * @returns Object containing cursor and members array
   */
  transformReply([cursor, members]: [BlobStringReply, Array<BlobStringReply>]) {
    return {
      cursor,
      members
    };
  }
} as const satisfies Command;
