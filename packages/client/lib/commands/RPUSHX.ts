import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { pushVariadicArguments } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: 1,
  transformArguments(
    key: RedisArgument,
    element: RedisArgument
  ) {
    return pushVariadicArguments(['RPUSHX', key], element);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
