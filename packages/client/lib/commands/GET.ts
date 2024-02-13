import { RedisArgument, BlobStringReply, NullReply, Command } from '../RESP/types';
import { CommandParser } from '../commander';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.setCachable();
    switch (parser.resp) {
      case 2:
      case 3:
        parser.setTransformReply((reply) => { return reply} );
        break;
    }
    parser.push('GET');
    parser.pushKey(key);
  },
  transformArguments: () => { return [] },
  transformReply: undefined as unknown as () => BlobStringReply | NullReply
} as const satisfies Command;
