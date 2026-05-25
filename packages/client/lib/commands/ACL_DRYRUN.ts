import { CommandParser } from '../client/parser';
import { RedisArgument, SimpleStringReply, BlobStringReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, username: RedisArgument, command: Array<RedisArgument>) {
    parser.push('ACL', 'DRYRUN', username, ...command);
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'> | BlobStringReply
} as const satisfies Command;

