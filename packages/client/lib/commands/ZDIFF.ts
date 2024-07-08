import { ArrayReply, BlobStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';
import { RedisVariadicArgument } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: 2,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, keys: RedisVariadicArgument) {
    parser.push('ZDIFF');
    parser.pushKeysLength(keys);
  },
  transformArguments(keys: RedisVariadicArgument) { return [] },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
