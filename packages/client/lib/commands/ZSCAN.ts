import { RedisArgument, BlobStringReply, Command } from '../RESP/types';
import { ScanOptions, ZMember, pushScanArguments, transformNumberInfinityReply } from './generic-transformers';

export interface HScanEntry {
  field: BlobStringReply;
  value: BlobStringReply;
}

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(
    key: RedisArgument,
    cursor: number,
    options?: ScanOptions
  ) {
    return pushScanArguments(['ZSCAN', key], cursor, options);
  },
  transformReply([cursor, rawMembers]: [BlobStringReply, Array<BlobStringReply>]) {
    const members = [];
    let i = 0;
    while (i < rawMembers.length) {
      members.push({
        value: rawMembers[i++],
        score: transformNumberInfinityReply(rawMembers[i++])
      } satisfies ZMember);
    }

    return {
      cursor: Number(cursor),
      members
    };
  }
} as const satisfies Command;
