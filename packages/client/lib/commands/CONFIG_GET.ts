import { MapReply, BlobStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';
import { RedisVariadicArgument, transformTuplesReply } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, parameters: RedisVariadicArgument) {
    parser.pushVariadic(['CONFIG', 'GET']);
    parser.pushVariadic(parameters);
  },
  transformArguments(parameters: RedisVariadicArgument) { return [] },
  transformReply: {
    2: transformTuplesReply,
    3: undefined as unknown as () => MapReply<BlobStringReply, BlobStringReply>
  }
} as const satisfies Command;
