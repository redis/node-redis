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
