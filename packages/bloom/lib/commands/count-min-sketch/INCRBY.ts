import { RedisArgument, ArrayReply, NumberReply, Command } from '@redis/client/dist/lib/RESP/types';

export interface BfIncrByItem {
  item: RedisArgument;
  incrementBy: number;
}

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments(
    key: RedisArgument,
    items: BfIncrByItem | Array<BfIncrByItem>
  ) {
    const args = ['CMS.INCRBY', key];

    if (Array.isArray(items)) {
      for (const item of items) {
        pushIncrByItem(args, item);
      }
    } else {
      pushIncrByItem(args, items);
    }

    return args;
  },
  transformReply: undefined as unknown as () => ArrayReply<NumberReply>
} as const satisfies Command;

function pushIncrByItem(args: Array<RedisArgument>, { item, incrementBy }: BfIncrByItem): void {
  args.push(item, incrementBy.toString());
}
