import { RedisArgument, ArrayReply, BlobStringReply, Command } from '../RESP/types';

export type HRandFieldCountWithValuesReply = Array<{
  field: BlobStringReply;
  value: BlobStringReply;
}>;

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(key: RedisArgument, count: number) {
    return ['HRANDFIELD', key, count.toString(), 'WITHVALUES'];
  },
  transformReply: {
    2: (rawReply: ArrayReply<BlobStringReply>) => {
      const reply: HRandFieldCountWithValuesReply = [];

      let i = 0;
      while (i < rawReply.length) {
        reply.push({
          field: rawReply[i++],
          value: rawReply[i++]
        });
      }

      return reply;
    },
    3: (reply: ArrayReply<[BlobStringReply, BlobStringReply]>) => {
      return reply.map(([field, value]) => ({
        field,
        value
      })) satisfies HRandFieldCountWithValuesReply;
    }
  }
} as const satisfies Command;
 