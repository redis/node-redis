import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, NumberReply, Command } from '@redis/client/dist/lib/RESP/types';
import { RedisVariadicArgument } from '@redis/client/dist/lib/commands/generic-transformers';

export default {
  parseCommand(parser: CommandParser, dictionary: RedisArgument, term: RedisVariadicArgument) {
    parser.push('FT.DICTDEL');
    // Dictionary names are Redis keys, but FT.DICT* is cluster-keyless — prefix
    // on the wire without registering a routing key.
    parser.pushPrefixed(dictionary);
    parser.pushVariadic(term);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
