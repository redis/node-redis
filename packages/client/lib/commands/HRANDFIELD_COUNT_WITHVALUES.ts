import { RedisArgument, ArrayReply, TuplesReply, BlobStringReply, UnwrapReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export type HRandFieldCountWithValuesReply = Array<{
  field: BlobStringReply;
  value: BlobStringReply;
}>;

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument, count: number) {
    parser.push('HRANDFIELD');
    parser.pushKey(key);
    parser.pushVariadic([count.toString(), 'WITHVALUES']);
  },
  transformArguments(key: RedisArgument, count: number) { return [] },
  transformReply: {
    2: (rawReply: UnwrapReply<ArrayReply<BlobStringReply>>) => {
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
    3: (reply: UnwrapReply<ArrayReply<TuplesReply<[BlobStringReply, BlobStringReply]>>>) => {
      return reply.map(entry => {
        const [field, value] = entry as unknown as UnwrapReply<typeof entry>;
        return {
          field,
          value
        };
      }) satisfies HRandFieldCountWithValuesReply;
    }
  }
} as const satisfies Command;
 