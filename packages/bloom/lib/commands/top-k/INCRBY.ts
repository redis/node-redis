import { RedisArgument, ArrayReply, SimpleStringReply, NullReply, Command } from '@redis/client/dist/lib/RESP/types';

export interface TopKIncrByItem {
  item: string;
  incrementBy: number;
}

function pushIncrByItem(args: Array<RedisArgument>, { item, incrementBy }: TopKIncrByItem) {
  args.push(item, incrementBy.toString());
}

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments(
    key: RedisArgument,
    items: TopKIncrByItem | Array<TopKIncrByItem>
  ) {
    const args = ['TOPK.INCRBY', key];

    if (Array.isArray(items)) {
      for (const item of items) {
        pushIncrByItem(args, item);
      }
    } else {
      pushIncrByItem(args, items);
    }

    return args;
  },
  transformReply: undefined as unknown as () => ArrayReply<SimpleStringReply | NullReply>
} as const satisfies Command;
