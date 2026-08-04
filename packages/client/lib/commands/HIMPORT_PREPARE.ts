import { CommandParser } from '../client/parser';
import { SimpleStringReply, Command } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';

export default {
  parseCommand(parser: CommandParser, fieldset: string, fields: RedisVariadicArgument) {
    parser.push('HIMPORT', 'PREPARE', fieldset);
    parser.pushVariadic(fields);
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
