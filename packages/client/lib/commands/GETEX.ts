import { RedisArgument, BlobStringReply, NullReply, Command } from '../RESP/types';
import { transformEXAT, transformPXAT } from './generic-transformers';

export type GetExModes = {
  EX: number;
} | {
  PX: number;
} | {
  EXAT: number | Date;
} | {
  PXAT: number | Date;
} | {
  PERSIST: true;
};

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(key: RedisArgument, mode: GetExModes) {
    const args = ['GETEX', key];

    if ('EX' in mode) {
      args.push('EX', mode.EX.toString());
    } else if ('PX' in mode) {
      args.push('PX', mode.PX.toString());
    } else if ('EXAT' in mode) {
      args.push('EXAT', transformEXAT(mode.EXAT));
    } else if ('PXAT' in mode) {
      args.push('PXAT', transformPXAT(mode.PXAT));
    } else { // PERSIST
      args.push('PERSIST');
    }

    return args;
  },
  transformReply: undefined as unknown as () => BlobStringReply | NullReply
} as const satisfies Command;
