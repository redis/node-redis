import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';

export default {
  IS_READ_ONLY: false,
  /**
   * Constructs the SMOVE command
   * 
   * @param parser - The command parser
   * @param source - The source set key
   * @param destination - The destination set key
   * @param member - The member to move
   * @see https://redis.io/commands/smove/
   */
  parseCommand(parser: CommandParser, source: RedisArgument, destination: RedisArgument, member: RedisArgument) {
    parser.push('SMOVE');
    parser.pushKeys([source, destination]);
    parser.push(member);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
