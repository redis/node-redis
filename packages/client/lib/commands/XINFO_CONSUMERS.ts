import { CommandParser } from '../client/parser';
import { RedisArgument, ArrayReply, TuplesToMapReply, BlobStringReply, NumberReply, UnwrapReply, Resp2Reply, Command } from '../RESP/types';

export type XInfoConsumersReply = ArrayReply<TuplesToMapReply<[
  [BlobStringReply<'name'>, BlobStringReply],
  [BlobStringReply<'pending'>, NumberReply],
  [BlobStringReply<'idle'>, NumberReply],
  /** added in 7.2 */
  [BlobStringReply<'inactive'>, NumberReply]
]>>;

export default {
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument, group: RedisArgument) {
    parser.push('XINFO', 'CONSUMERS');
    parser.pushKey(key);
    parser.push(group);
  },
  transformReply: {
    2: (reply: UnwrapReply<Resp2Reply<XInfoConsumersReply>>) => {
      return reply.map(consumer => {
        const unwrapped = consumer as unknown as UnwrapReply<typeof consumer>;
        return {
          name: unwrapped[1],
          pending: unwrapped[3],
          idle: unwrapped[5],
          inactive: unwrapped[7]
        };
      });
    },
    3: undefined as unknown as () => XInfoConsumersReply
  }
} as const satisfies Command;
