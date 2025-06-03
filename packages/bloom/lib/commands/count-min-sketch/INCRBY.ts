import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, ArrayReply, NumberReply, Command } from '@redis/client/dist/lib/RESP/types';

export interface BfIncrByItem {
  item: RedisArgument;
  incrementBy: number;
}

export default {
  IS_READ_ONLY: false,
  /**
   * Increases the count of one or more items in a Count-Min Sketch
   * @param parser - The command parser
   * @param key - The name of the sketch
   * @param items - A single item or array of items to increment, each with an item and increment value
   */
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    items: BfIncrByItem | Array<BfIncrByItem>
  ) {
    parser.push('CMS.INCRBY');
    parser.pushKey(key);

    if (Array.isArray(items)) {
      for (const item of items) {
        pushIncrByItem(parser, item);
      }
    } else {
      pushIncrByItem(parser, items);
    }
  },
  transformReply: undefined as unknown as () => ArrayReply<NumberReply>
} as const satisfies Command;

function pushIncrByItem(parser: CommandParser, { item, incrementBy }: BfIncrByItem): void {
  parser.push(item, incrementBy.toString());
}
