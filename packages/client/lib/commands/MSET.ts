import { CommandParser } from '../client/parser';
import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';

export type MSetArguments =
  Array<[RedisArgument, RedisArgument]> |
  Array<RedisArgument> |
  Record<string, RedisArgument>;

export function parseMSetArguments(parser: CommandParser, toSet: MSetArguments) {
  if (Array.isArray(toSet)) {
    if (toSet.length == 0) {
      throw new Error("empty toSet Argument")
    }
    if (Array.isArray(toSet[0])) {
      for (const tuple of (toSet as Array<[RedisArgument, RedisArgument]>)) {
        parser.pushKey(tuple[0]);
        parser.push(tuple[1]);
      }
    } else {
      const arr = toSet as Array<RedisArgument>;
      for (let i=0; i < arr.length; i += 2) {
        parser.pushKey(arr[i]);
        parser.push(arr[i+1]);
      }
    }
  } else {
    for (const tuple of Object.entries(toSet)) {
      parser.pushKey(tuple[0]);
      parser.push(tuple[1]);
    }
  }
}

export default {
  IS_READ_ONLY: true,
  /**
   * Constructs the MSET command
   * 
   * @param parser - The command parser
   * @param toSet - Key-value pairs to set (array of tuples, flat array, or object)
   * @see https://redis.io/commands/mset/
   */
  parseCommand(parser: CommandParser, toSet: MSetArguments) {
    parser.push('MSET');
    return parseMSetArguments(parser, toSet);
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
