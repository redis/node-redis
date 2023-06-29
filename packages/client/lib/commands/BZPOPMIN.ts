import { Command } from '../RESP/types';
import BZPOPMAX, { BZPopArguments, transformBZPopArguments } from './BZPOPMAX';

export default {
  FIRST_KEY_INDEX: BZPOPMAX.FIRST_KEY_INDEX,
  IS_READ_ONLY: BZPOPMAX.IS_READ_ONLY,
  transformArguments(...args: BZPopArguments) {
    return transformBZPopArguments('BZPOPMIN', ...args);
  },
  transformReply: BZPOPMAX.transformReply
} as const satisfies Command;

