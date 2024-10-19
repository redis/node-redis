import { CommandParser } from '@redis/client/lib/client/parser';
import { RedisArgument, ArrayReply, SimpleStringReply, NullReply, Command } from '@redis/client/lib/RESP/types';

export interface TopKIncrByItem {
  item: string;
  incrementBy: number;
}

function pushIncrByItem(parser: CommandParser, { item, incrementBy }: TopKIncrByItem) {
  parser.push(item, incrementBy.toString());
}

export default {
  IS_READ_ONLY: false,
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    items: TopKIncrByItem | Array<TopKIncrByItem>
  ) {
    parser.push('TOPK.INCRBY');
    parser.pushKey(key);

    if (Array.isArray(items)) {
      for (const item of items) {
        pushIncrByItem(parser, item);
      }
    } else {
      pushIncrByItem(parser, items);
    }
  },
  transformReply: undefined as unknown as () => ArrayReply<SimpleStringReply | NullReply>
} as const satisfies Command;
