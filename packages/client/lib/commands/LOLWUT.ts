import { CommandParser } from '../client/parser';
import { BlobStringReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Constructs the LOLWUT command
   * 
   * @param parser - The command parser
   * @param version - Optional version parameter
   * @param optionalArguments - Additional optional numeric arguments
   * @see https://redis.io/commands/lolwut/
   */
  parseCommand(parser: CommandParser, version?: number, ...optionalArguments: Array<number>) {
    parser.push('LOLWUT');
    if (version) {
      parser.push(
        'VERSION',
        version.toString()
      );
      parser.pushVariadic(optionalArguments.map(String));
    }
  },
  transformReply: undefined as unknown as () => BlobStringReply
} as const satisfies Command;
