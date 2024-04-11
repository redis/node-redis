import { Command } from '../RESP/types';
import ZMPOP, { ZMPopArguments, transformZMPopArguments } from './ZMPOP';

export default {
  FIRST_KEY_INDEX: 3,
  IS_READ_ONLY: false,
  transformArguments(timeout: number, ...args: ZMPopArguments) {
    return transformZMPopArguments(['BZMPOP', timeout.toString()], ...args);
  },
  transformReply: ZMPOP.transformReply
} as const satisfies Command;
