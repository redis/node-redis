import { CommandParser } from '../../client/parser';
import { RedisArgument, SimpleStringReply, Command } from '../../RESP/types';

export type SentinelSetOptions = Array<{
  option: RedisArgument;
  value: RedisArgument;
}>;

export default {
  parseCommand(parser: CommandParser, dbname: RedisArgument, options: SentinelSetOptions) {
    parser.push('SENTINEL', 'SET', dbname);

    for (const option of options) {
      parser.push(option.option, option.value);
    }
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'> 
} as const satisfies Command;
