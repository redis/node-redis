import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, SimpleStringReply, Command } from '@redis/client/dist/lib/RESP/types';

// using `string & {}` to avoid TS widening the type to `string`
// TODO
type FtConfigProperties = 'a' | 'b' | (string & {}) | Buffer;

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Sets a RediSearch configuration option value.
   * @param parser - The command parser
   * @param property - The name of the configuration option to set
   * @param value - The value to set for the configuration option
   */
  parseCommand(parser: CommandParser, property: FtConfigProperties, value: RedisArgument) {
    parser.push('FT.CONFIG', 'SET', property, value);
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
