
import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { ZKeys } from './generic-transformers';
import { parseZInterArguments, ZInterOptions } from './ZINTER';

export default {
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
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
