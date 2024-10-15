import { CommandParser } from '../client/parser';
import { MapReply, BlobStringReply, Command } from '../RESP/types';
import { RedisVariadicArgument, transformTuplesReply } from './generic-transformers';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, parameters: RedisVariadicArgument) {
    parser.push('CONFIG', 'GET');
    parser.pushVariadic(parameters);
  },
  transformReply: {
    2: transformTuplesReply,
    3: undefined as unknown as () => MapReply<BlobStringReply, BlobStringReply>
  }
} as const satisfies Command;
