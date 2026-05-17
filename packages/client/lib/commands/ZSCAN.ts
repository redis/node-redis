import { CommandParser } from '../client/parser';
import { RedisArgument, ArrayReply, BlobStringReply, Command, TypeMapping } from '../RESP/types';
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
  transformReply(
    [cursor, rawMembers]: [BlobStringReply, ArrayReply<BlobStringReply>],
    preserve?: unknown,
    typeMapping?: TypeMapping
  ) {
    return {
      cursor,
      members: transformSortedSetReply[2](rawMembers, preserve, typeMapping)
    };
  }
} as const satisfies Command;
