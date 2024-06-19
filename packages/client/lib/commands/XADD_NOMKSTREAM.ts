import { RedisArgument, BlobStringReply, NullReply, Command } from '../RESP/types';
import { XAddOptions, parseXAddArguments } from './XADD';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  parseCommand: parseXAddArguments.bind(undefined, 'NOMKSTREAM'),
  transformArguments(
    key: RedisArgument,
    id: RedisArgument,
    message: Record<string, RedisArgument>,
    options?: XAddOptions
  ) { return [] },
  transformReply: undefined as unknown as () => BlobStringReply | NullReply
} as const satisfies Command;
