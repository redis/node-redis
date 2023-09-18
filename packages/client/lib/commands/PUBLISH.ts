import { RedisArgument, NumberReply, Command } from '../RESP/types';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  IS_FORWARD_COMMAND: true,
  transformArguments(channel: RedisArgument, message: RedisArgument) {
    return ['PUBLISH', channel, message];
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
