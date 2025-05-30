import { CommandParser } from '../client/parser';
import { ArrayReply, BlobStringReply, Command } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';

export default {
  CACHEABLE: true,
  IS_READ_ONLY: true,
  /**
   * Constructs the SDIFF command
   * 
   * @param parser - The command parser
   * @param keys - One or more set keys to compute the difference from
   * @see https://redis.io/commands/sdiff/
   */
  parseCommand(parser: CommandParser, keys: RedisVariadicArgument) {
    parser.push('SDIFF');
    parser.pushKeys(keys);
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
