import { Command } from '@redis/client/dist/lib/RESP/types';
import INCRBY, { transformIncrByArguments } from './INCRBY';

export default {
  FIRST_KEY_INDEX: INCRBY.FIRST_KEY_INDEX,
  IS_READ_ONLY: INCRBY.IS_READ_ONLY,
  transformArguments: transformIncrByArguments.bind(undefined, 'TS.DECRBY'),
  transformReply: INCRBY.transformReply
} as const satisfies Command;
