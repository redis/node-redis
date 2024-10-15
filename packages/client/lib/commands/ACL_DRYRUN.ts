import { RedisArgument, SimpleStringReply, BlobStringReply, Command } from '../RESP/types';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments(username: RedisArgument, command: Array<RedisArgument>) {
    return [
      'ACL',
      'DRYRUN',
      username,
      ...command
    ];
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'> | BlobStringReply
} as const satisfies Command;

