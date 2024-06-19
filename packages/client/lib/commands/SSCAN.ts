import { RedisArgument, BlobStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';
import { ScanCommonOptions, parseScanArguments} from './SCAN';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
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
  transformArguments(
    key: RedisArgument,
    cursor: RedisArgument,
    options?: ScanCommonOptions
  ) { return [] },
  transformReply([cursor, members]: [BlobStringReply, Array<BlobStringReply>]) {
    return {
      cursor,
      members
    };
  }
} as const satisfies Command;
