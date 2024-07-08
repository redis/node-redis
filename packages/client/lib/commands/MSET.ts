import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export type MSetArguments =
  Array<[RedisArgument, RedisArgument]> |
  Array<RedisArgument> |
  Record<string, RedisArgument>;

export function mSetArguments(command: string, toSet: MSetArguments) { return [] }

export function parseMSetArguments(command: string, parser: CommandParser, toSet: MSetArguments) {
  parser.push(command);
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
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  parseCommand: parseMSetArguments.bind(undefined, 'MSET'),
  transformArguments: mSetArguments.bind(undefined, 'MSET'),
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
