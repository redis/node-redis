import { RedisArgument, NullReply, TuplesReply, BlobStringReply, DoubleReply, UnwrapReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';
import { RedisVariadicArgument, pushVariadicArguments } from './generic-transformers';

export function transformBZPopArguments(
  command: RedisArgument,
  key: RedisVariadicArgument,
  timeout: number
) {
  const args = pushVariadicArguments([command], key);
  args.push(timeout.toString());
  return args;
}

export type BZPopArguments = typeof transformBZPopArguments extends (_: any, ...args: infer T) => any ? T : never;

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, ...args: BZPopArguments) {
    parser.push('BZPOPMAX');
    parser.pushKeys(args[0]);
    parser.push(args[1].toString());
  },
  transformArguments(...args: BZPopArguments) { return [] },
  transformReply: {
    2(reply: UnwrapReply<NullReply | TuplesReply<[BlobStringReply, BlobStringReply, BlobStringReply]>>) {
      return reply === null ? null : {
        key: reply[0],
        value: reply[1],
        score: Number(reply[2])
      };
    },
    3(reply: UnwrapReply<NullReply | TuplesReply<[BlobStringReply, BlobStringReply, DoubleReply]>>) {
      return reply === null ? null : {
        key: reply[0],
        value: reply[1],
        score: reply[2]
      };
    }
  }
} as const satisfies Command;

