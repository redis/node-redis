import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';

export default {
  IS_READ_ONLY: true,
  /**
   * Computes the difference between the first and all successive sorted sets and stores it in a new key.
   * @param parser - The Redis command parser.
   * @param destination - Destination key where the result will be stored.
   * @param inputKeys - Keys of the sorted sets to find the difference between.
   */
  parseCommand(parser: CommandParser, destination: RedisArgument, inputKeys: RedisVariadicArgument) {
    parser.push('ZDIFFSTORE');
    parser.pushKey(destination);
    parser.pushKeysLength(inputKeys);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
