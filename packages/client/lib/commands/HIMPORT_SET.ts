import { CommandParser } from '../client/parser';
import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';

export default {
  parseCommand(parser: CommandParser, key: RedisArgument, fieldset: string, values: RedisVariadicArgument) {
    parser.push('HIMPORT', 'SET');
    parser.pushKey(key);
    parser.push(fieldset);
    parser.pushVariadic(values);
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
