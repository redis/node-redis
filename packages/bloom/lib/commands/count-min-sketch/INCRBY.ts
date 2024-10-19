import { CommandParser } from '@redis/client/lib/client/parser';
import { RedisArgument, ArrayReply, NumberReply, Command } from '@redis/client/lib/RESP/types';

export interface BfIncrByItem {
  item: RedisArgument;
  incrementBy: number;
}

export default {
  IS_READ_ONLY: false,
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
