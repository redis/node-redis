import { CommandParser } from '../client/parser';
import { UnwrapReply, NullReply, TuplesReply, BlobStringReply, Command } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';

export default {
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisVariadicArgument, timeout: number) {
    parser.push('BLPOP');
    parser.pushKeys(key);
    parser.push(timeout.toString());
  },
  transformReply(reply: UnwrapReply<NullReply | TuplesReply<[BlobStringReply, BlobStringReply]>>) {
    if (reply === null) return null;

    return {
      key: reply[0],
      element: reply[1]
    };
  }
} as const satisfies Command;
