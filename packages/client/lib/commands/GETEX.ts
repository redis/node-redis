import { CommandParser } from '../client/parser';
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
  IS_READ_ONLY: true,
  /**
   * Gets the value of a key and optionally sets its expiration
   * @param parser - The Redis command parser
   * @param key - Key to get value from
   * @param options - Options for setting expiration
   */
  parseCommand(parser: CommandParser, key: RedisArgument, options: GetExOptions) {
    parser.push('GETEX');
    parser.pushKey(key);

    if ('type' in options) {
      switch (options.type) {
        case 'EX':
        case 'PX':
          parser.push(options.type, options.value.toString());
          break;
        
        case 'EXAT':
        case 'PXAT':
          parser.push(options.type, transformEXAT(options.value));
          break;

        case 'PERSIST':
          parser.push('PERSIST');
          break;
      }
    } else {
      if ('EX' in options) {
        parser.push('EX', options.EX.toString());
      } else if ('PX' in options) {
        parser.push('PX', options.PX.toString());
      } else if ('EXAT' in options) {
        parser.push('EXAT', transformEXAT(options.EXAT));
      } else if ('PXAT' in options) {
        parser.push('PXAT', transformPXAT(options.PXAT));
      } else { // PERSIST
        parser.push('PERSIST');
      }
    }
  },
  transformReply: undefined as unknown as () => BlobStringReply | NullReply
} as const satisfies Command;
