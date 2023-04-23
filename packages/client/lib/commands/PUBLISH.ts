import { RedisArgument, NumberReply, Command } from '../RESP/types';

export default {
  IS_READ_ONLY: true,
  FIRST_KEY_INDEX: undefined,
  transformArguments(channel: RedisArgument, message: RedisArgument) {
    return ['PUBLISH', channel, message];
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
