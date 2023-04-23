import { RedisArgument, Command } from '../RESP/types';
import { transformTuplesReply } from './generic-transformers';

export default {
  IS_READ_ONLY: true,
  transformArguments(parameter: RedisArgument) {
    return ['CONFIG', 'GET', parameter];
  },
  transformReply: transformTuplesReply
} as const satisfies Command;
