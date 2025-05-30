import { CommandParser } from '../client/parser';
import { RedisArgument, ArrayReply, BlobStringReply, Command } from '../RESP/types';

export default {
  IS_READ_ONLY: true,
  /**
   * Constructs the HRANDFIELD command with count parameter
   * 
   * @param parser - The command parser
   * @param key - The key of the hash to get random fields from
   * @param count - The number of fields to return (positive: unique fields, negative: may repeat fields)
   * @see https://redis.io/commands/hrandfield/
   */
  parseCommand(parser: CommandParser, key: RedisArgument, count: number) {
    parser.push('HRANDFIELD');
    parser.pushKey(key);
    parser.push(count.toString());
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
