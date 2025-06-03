import { CommandParser } from '../client/parser';
import { RedisArgument, ArrayReply, TuplesReply, BlobStringReply, UnwrapReply, Command } from '../RESP/types';

export type HRandFieldCountWithValuesReply = Array<{
  field: BlobStringReply;
  value: BlobStringReply;
}>;

export default {
  IS_READ_ONLY: true,
  /**
   * Constructs the HRANDFIELD command with count parameter and WITHVALUES option
   * 
   * @param parser - The command parser
   * @param key - The key of the hash to get random fields from
   * @param count - The number of fields to return (positive: unique fields, negative: may repeat fields)
   * @see https://redis.io/commands/hrandfield/
   */
  parseCommand(parser: CommandParser, key: RedisArgument, count: number) {
    parser.push('HRANDFIELD');
    parser.pushKey(key);
    parser.push(count.toString(), 'WITHVALUES');
  },
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
 