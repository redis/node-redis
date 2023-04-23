import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';

export type MSetArguments =
  Array<[RedisArgument, RedisArgument]> |
  Array<RedisArgument> |
  Record<string, RedisArgument>;

export function mSetArguments(command: string, toSet: MSetArguments) {
  const args: Array<RedisArgument> = [command];

  if (Array.isArray(toSet)) {
    args.push(...toSet.flat());
  } else {
    for (const tuple of Object.entries(toSet)) {
      args.push(...tuple);
    }
  }

  return args;
}

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments: mSetArguments.bind(undefined, 'MSET'),
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
