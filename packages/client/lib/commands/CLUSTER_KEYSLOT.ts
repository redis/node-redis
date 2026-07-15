import { CommandParser } from '../client/parser';
import { Command, NumberReply, RedisArgument } from '../RESP/types';

export default {
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('CLUSTER', 'KEYSLOT');
    // Use pushKey so a configured `keyPrefix` is applied to the reported key: the returned
    // slot then matches where prefixed commands for `key` are actually routed. The command's
    // result is identical on any node, so key-based routing is irrelevant to correctness.
    parser.pushKey(key);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
