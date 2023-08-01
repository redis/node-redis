import { RedisArgument, SimpleStringReply, BlobStringReply, NullReply, Command } from '../RESP/types';

export interface SetOptions {
  expiration?: {
    type: 'EX' | 'PX' | 'EXAT' | 'PXAT';
    value: number;
  } | {
    type: 'KEEPTTL';
  } | 'KEEPTTL';
  /**
   * @deprecated Use `expiration` { type: 'EX', value: number } instead
   */
  EX?: number;
  /**
   * @deprecated Use `expiration` { type: 'PX', value: number } instead
   */
  PX?: number;
  /**
   * @deprecated Use `expiration` { type: 'EXAT', value: number } instead
   */
  EXAT?: number;
  /**
   * @deprecated Use `expiration` { type: 'PXAT', value: number } instead
   */
  PXAT?: number;
  /**
   * @deprecated Use `expiration` 'KEEPTTL' instead
   */
  KEEPTTL?: boolean;

  condition?: 'NX' | 'XX';
  /**
   * @deprecated Use `{ condition: 'NX' }` instead.
   */
  NX?: boolean;
  /**
   * @deprecated Use `{ condition: 'XX' }` instead.
   */
  XX?: boolean;
  
  GET?: boolean;
}

export default {
  FIRST_KEY_INDEX: 1,
  transformArguments(key: RedisArgument, value: RedisArgument | number, options?: SetOptions) {
    const args = [
      'SET',
      key,
      typeof value === 'number' ? value.toString() : value
    ];

    if (options?.expiration) {
      if (typeof options.expiration === 'string') {
        args.push(options.expiration);
      } else if (options.expiration.type === 'KEEPTTL') {
        args.push('KEEPTTL');
      } else {
        args.push(
          options.expiration.type,
          options.expiration.value.toString()
        );
      }
    } else if (options?.EX !== undefined) {
      args.push('EX', options.EX.toString());
    } else if (options?.PX !== undefined) {
      args.push('PX', options.PX.toString());
    } else if (options?.EXAT !== undefined) {
      args.push('EXAT', options.EXAT.toString());
    } else if (options?.PXAT !== undefined) {
      args.push('PXAT', options.PXAT.toString());
    } else if (options?.KEEPTTL) {
      args.push('KEEPTTL');
    }

    if (options?.condition) {
      args.push(options.condition);
    } else if (options?.NX) {
      args.push('NX');
    } else if (options?.XX) {
      args.push('XX');
    }

    if (options?.GET) {
      args.push('GET');
    }

    return args;
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'> | BlobStringReply | NullReply
} as const satisfies Command;
