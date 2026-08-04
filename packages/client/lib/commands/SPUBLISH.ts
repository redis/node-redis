import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';

export default {
  parseCommand(parser: CommandParser, channel: RedisArgument, message: RedisArgument) {
    parser.push('SPUBLISH');
    // The channel routes the command to the correct shard (like a key) but must NOT be
    // prefixed: Pub/Sub channels are a separate namespace and the subscribe side
    // (SSUBSCRIBE) does not apply `keyPrefix` either.
    parser.pushKey(channel, false);
    parser.push(message);
  },
  transformReply: undefined as unknown as () => NumberReply,
} as const satisfies Command;
