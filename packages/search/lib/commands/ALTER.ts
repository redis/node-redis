import { CommandParser } from '@redis/client/lib/client/parser';
import { RedisArgument, SimpleStringReply, Command } from '@redis/client/lib/RESP/types';
import { RediSearchSchema, parseSchema } from './CREATE';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, index: RedisArgument, schema: RediSearchSchema) {
    parser.push('FT.ALTER', index, 'SCHEMA', 'ADD');
    parseSchema(parser, schema);
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
