import { Command, RedisArgument } from '../RESP/types';
import { pushVariadicArgument } from './generic-transformers';

/**
 * @readonly
 * @enum {number}
 */
export const HASH_EXPIRATION = {
  /** @property {number} */
  /** The field does not exist */
  FIELD_NOT_EXISTS: -2,
  /** @property {number} */
  /** Specified NX | XX | GT | LT condition not met */
  CONDITION_NOT_MET: 0,
  /** @property {number} */
  /** Expiration time was set or updated */
  UPDATED: 1,
  /** @property {number} */
  /** Field deleted because the specified expiration time is in the past */
  DELETED: 2
} as const;
  
export type HashExpiration = typeof HASH_EXPIRATION[keyof typeof HASH_EXPIRATION];

export default {
  FIRST_KEY_INDEX: 1,
  transformArguments(key: RedisArgument, 
    fields: RedisArgument | Array<RedisArgument>,
    seconds: number,
    mode?: 'NX' | 'XX' | 'GT' | 'LT',
  ) {
    const args = ['HEXPIRE', key, seconds.toString()];

    if (mode) {
      args.push(mode);
    }

    args.push('FIELDS');

    return pushVariadicArgument(args, fields);
  },
  transformReply: undefined as unknown as () => Array<HashExpiration>
} as const satisfies Command;
