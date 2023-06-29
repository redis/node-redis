import { Command } from '../RESP/types';
import LMPOP, { LMPopArguments, transformLMPopArguments } from './LMPOP';

export default {
  FIRST_KEY_INDEX: 3,
  IS_READ_ONLY: false,
  transformArguments(
    timeout: number,
    ...args: LMPopArguments
  ) {
    return transformLMPopArguments(
      ['BLMPOP', timeout.toString()],
      ...args
    );
  },
  transformReply: LMPOP.transformReply
} as const satisfies Command;
