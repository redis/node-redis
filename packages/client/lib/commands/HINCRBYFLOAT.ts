import { RedisArgument, BlobStringReply, Command } from '../RESP/types';

export default {
  FIRST_KEY_INDEX: 1,
  transformArguments(
    key: RedisArgument,
    field: RedisArgument,
    increment: number
  ) {
    return [
      'HINCRBYFLOAT',
      key,
      field,
      increment.toString()
    ];
  },
  transformReply: undefined as unknown as () => BlobStringReply
} as const satisfies Command;
