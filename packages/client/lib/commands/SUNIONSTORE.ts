import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';

export default {
  IS_READ_ONLY: false,
  /**
   * Constructs the SUNIONSTORE command to store the union of multiple sets into a destination set
   *
   * @param parser - The command parser
   * @param destination - The destination key to store the resulting set
   * @param keys - One or more source set keys to compute the union from
   * @returns The number of elements in the resulting set
   * @see https://redis.io/commands/sunionstore/
   */
  parseCommand(parser: CommandParser, destination: RedisArgument, keys: RedisVariadicArgument) {
    parser.push('SUNIONSTORE');
    parser.pushKey(destination);
    parser.pushKeys(keys);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
