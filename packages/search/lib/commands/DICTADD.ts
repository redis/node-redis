import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, NumberReply, Command } from '@redis/client/dist/lib/RESP/types';
import { RedisVariadicArgument } from '@redis/client/dist/lib/commands/generic-transformers';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Adds terms to a dictionary.
   * @param parser - The command parser
   * @param dictionary - Name of the dictionary to add terms to
   * @param term - One or more terms to add to the dictionary
   */
  parseCommand(parser: CommandParser, dictionary: RedisArgument, term: RedisVariadicArgument) {
    parser.push('FT.DICTADD', dictionary);
    parser.pushVariadic(term);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
