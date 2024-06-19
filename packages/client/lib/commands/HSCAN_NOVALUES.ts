import { RedisArgument, BlobStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';
import { ScanCommonOptions } from './SCAN';
import HSCAN from './HSCAN';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    cursor: RedisArgument,
    options?: ScanCommonOptions
  ) {
    HSCAN.parseCommand(parser, key, cursor, options);
    parser.push('NOVALUES');
  },
  transformArguments(
    key: RedisArgument,
    cursor: RedisArgument,
    options?: ScanCommonOptions
  ) { return [] },
  transformReply([cursor, fields]: [BlobStringReply, Array<BlobStringReply>]) {
    return {
      cursor,
      fields
    };
  }
} as const satisfies Command;
