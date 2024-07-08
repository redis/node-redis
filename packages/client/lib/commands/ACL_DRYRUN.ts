import { RedisArgument, SimpleStringReply, BlobStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, username: RedisArgument, command: Array<RedisArgument>) {
    parser.pushVariadic(['ACL', 'DRYRUN', username, ...command]);
  },
  transformArguments(username: RedisArgument, command: Array<RedisArgument>) { return [] },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'> | BlobStringReply
} as const satisfies Command;

