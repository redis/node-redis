import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { RedisVariadicArgument, pushVariadicArgument } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: 2,
  IS_READ_ONLY: true,
  transformArguments(
    destination: RedisArgument,
    inputKeys: RedisVariadicArgument
  ) {
    return pushVariadicArgument(['ZDIFFSTORE', destination], inputKeys);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
