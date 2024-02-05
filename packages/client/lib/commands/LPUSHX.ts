import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { RedisVariadicArgument, pushVariadicArguments } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: 1,
  transformArguments(key: RedisArgument, elements: RedisVariadicArgument) {
    return pushVariadicArguments(['LPUSHX', key], elements);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
