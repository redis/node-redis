import { RedisArgument, ArrayReply, BlobStringReply, Command } from '../RESP/types';
import { ScanCommonOptions, pushScanArguments } from './SCAN';
import { transformSortedSetReply } from './generic-transformers';

export interface HScanEntry {
  field: BlobStringReply;
  value: BlobStringReply;
}

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(
    key: RedisArgument,
    cursor: RedisArgument,
    options?: ScanCommonOptions
  ) {
    return pushScanArguments(['ZSCAN', key], cursor, options);
  },
  transformReply([cursor, rawMembers]: [BlobStringReply, ArrayReply<BlobStringReply>]) {
    return {
      cursor,
      members: transformSortedSetReply[2](rawMembers)
    };
  }
} as const satisfies Command;
