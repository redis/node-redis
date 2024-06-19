
import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';
import { parseZInterArguments, ZInterOptions } from './ZINTER';
import { ZKeys } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  parseCommand(
    parser: CommandParser,
    destination: RedisArgument,
    keys: ZKeys,
    options?: ZInterOptions
  ) {
    parser.push('ZINTERSTORE');
    parser.pushKey(destination);
    parseZInterArguments(parser, keys, options);
  },
  transformArguments(destination: RedisArgument, keys: ZKeys, options?: ZInterOptions) { return [] },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
