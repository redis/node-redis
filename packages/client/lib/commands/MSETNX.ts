import { CommandParser } from '../client/parser';
import { SimpleStringReply, Command } from '../RESP/types';
import { MSetArguments, parseMSetArguments } from './MSET';

export default {
  IS_READ_ONLY: true,
  /**
   * Constructs the MSETNX command
   * 
   * @param parser - The command parser
   * @param toSet - Key-value pairs to set if none of the keys exist (array of tuples, flat array, or object)
   * @see https://redis.io/commands/msetnx/
   */
  parseCommand(parser: CommandParser, toSet: MSetArguments) {
    parser.push('MSETNX');
    return parseMSetArguments(parser, toSet);
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
