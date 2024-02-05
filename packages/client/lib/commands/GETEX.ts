import { RedisArgument, BlobStringReply, NullReply, Command } from '../RESP/types';
import { transformEXAT, transformPXAT } from './generic-transformers';

export type GetExOptions = {
  type: 'EX' | 'PX';
  value: number;
} | {
  type: 'EXAT' | 'PXAT';
  value: number | Date;
} | {
  type: 'PERSIST';
} | {
  /**
   * @deprecated Use `{ type: 'EX', value: number }` instead.
   */
  EX: number;
} | {
  /**
   * @deprecated Use `{ type: 'PX', value: number }` instead.
   */
  PX: number;
} | {
  /**
   * @deprecated Use `{ type: 'EXAT', value: number | Date }` instead.
   */
  EXAT: number | Date;
} | {
  /**
   * @deprecated Use `{ type: 'PXAT', value: number | Date }` instead.
   */
  PXAT: number | Date;
} | {
  /**
   * @deprecated Use `{ type: 'PERSIST' }` instead.
   */
  PERSIST: true;
};

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(key: RedisArgument, options: GetExOptions) {
    const args = ['GETEX', key];

    if ('type' in options) {
      switch (options.type) {
        case 'EX':
        case 'PX':
          args.push(options.type, options.value.toString());
          break;
        
        case 'EXAT':
        case 'PXAT':
          args.push(options.type, transformEXAT(options.value));
          break;

        case 'PERSIST':
          args.push('PERSIST');
          break;
      }
    } else {
      if ('EX' in options) {
        args.push('EX', options.EX.toString());
      } else if ('PX' in options) {
        args.push('PX', options.PX.toString());
      } else if ('EXAT' in options) {
        args.push('EXAT', transformEXAT(options.EXAT));
      } else if ('PXAT' in options) {
        args.push('PXAT', transformPXAT(options.PXAT));
      } else { // PERSIST
        args.push('PERSIST');
      }
    }
    
    return args;
  },
  transformReply: undefined as unknown as () => BlobStringReply | NullReply
} as const satisfies Command;
