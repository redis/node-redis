import { CommandParser } from '@redis/client/lib/client/parser';
import { RedisArgument, SimpleStringReply, Command } from '@redis/client/lib/RESP/types';

export default {
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, sourceKey: RedisArgument, destinationKey: RedisArgument) {
    parser.push('TS.DELETERULE');
    parser.pushKeys([sourceKey, destinationKey]);
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
