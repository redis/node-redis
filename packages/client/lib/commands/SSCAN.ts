import { CommandParser } from '../client/parser';
import { RedisArgument, BlobStringReply, Command } from '../RESP/types';
import { ScanCommonOptions, parseScanArguments} from './SCAN';

export default {
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
  transformReply([cursor, members]: [BlobStringReply, Array<BlobStringReply>]) {
    return {
      cursor,
      members
    };
  }
} as const satisfies Command;
