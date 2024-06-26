import { SimpleStringReply, Command, RedisArgument, NumberReply, UnwrapReply } from '@redis/client/dist/lib/RESP/types';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments(index: RedisArgument, cursorId: UnwrapReply<NumberReply>) {
    return ['FT.CURSOR', 'DEL', index, cursorId.toString()];
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
