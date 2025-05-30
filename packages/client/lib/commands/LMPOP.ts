import { CommandParser } from '../client/parser';
import { NullReply, TuplesReply, BlobStringReply, Command } from '../RESP/types';
import { ListSide, RedisVariadicArgument, Tail } from './generic-transformers';

export interface LMPopOptions {
  COUNT?: number;
}

export function parseLMPopArguments(
  parser: CommandParser,
  keys: RedisVariadicArgument,
  side: ListSide,
  options?: LMPopOptions
) {
  parser.pushKeysLength(keys);
  parser.push(side);

  if (options?.COUNT !== undefined) {
    parser.push('COUNT', options.COUNT.toString());
  }
}

export type LMPopArguments = Tail<Parameters<typeof parseLMPopArguments>>;

export default {
  IS_READ_ONLY: false,  
  /**
   * Constructs the LMPOP command
   * 
   * @param parser - The command parser
   * @param args - Arguments including keys, side (LEFT or RIGHT), and options
   * @see https://redis.io/commands/lmpop/
   */
  parseCommand(parser: CommandParser, ...args: LMPopArguments) {
    parser.push('LMPOP');
    parseLMPopArguments(parser, ...args);
  },
  transformReply: undefined as unknown as () => NullReply | TuplesReply<[
    key: BlobStringReply,
    elements: Array<BlobStringReply>
  ]>
} as const satisfies Command;
