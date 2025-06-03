import { CommandParser } from '../../client/parser';
import { RedisArgument, SimpleStringReply, Command } from '../../RESP/types';

export type SentinelSetOptions = Array<{
  option: RedisArgument;
  value: RedisArgument;
}>;

export default {
  /**
   * Sets configuration parameters for a specific master.
   * @param parser - The Redis command parser.
   * @param dbname - Name of the master.
   * @param options - Configuration options to set as option-value pairs.
   */
  parseCommand(parser: CommandParser, dbname: RedisArgument, options: SentinelSetOptions) {
    parser.push('SENTINEL', 'SET', dbname);

    for (const option of options) {
      parser.push(option.option, option.value);
    }
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'> 
} as const satisfies Command;
