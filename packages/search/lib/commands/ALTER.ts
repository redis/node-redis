import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, SimpleStringReply, Command } from '@redis/client/dist/lib/RESP/types';
import { RediSearchSchema, parseSchema } from './CREATE';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Alters an existing RediSearch index schema by adding new fields.
   * @param parser - The command parser
   * @param index - The index to alter
   * @param schema - The schema definition containing new fields to add
   */
  parseCommand(parser: CommandParser, index: RedisArgument, schema: RediSearchSchema) {
    parser.push('FT.ALTER', index, 'SCHEMA', 'ADD');
    parseSchema(parser, schema);
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
