import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, ArrayReply, SimpleStringReply, NullReply, Command } from '@redis/client/dist/lib/RESP/types';

export interface TopKIncrByItem {
  item: string;
  incrementBy: number;
}

function pushIncrByItem(parser: CommandParser, { item, incrementBy }: TopKIncrByItem) {
  parser.push(item, incrementBy.toString());
}

export default {
  IS_READ_ONLY: false,
  /**
   * Increases the score of one or more items in a Top-K filter by specified increments
   * @param parser - The command parser
   * @param key - The name of the Top-K filter
   * @param items - A single item or array of items to increment, each with an item name and increment value
   */
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
