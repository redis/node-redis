import { CommandParser } from '../client/parser';
import { ArrayReply, Command, RedisArgument } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';

export const HASH_EXPIRATION = {
  /** The field does not exist */
  FIELD_NOT_EXISTS: -2,
  /** Specified NX | XX | GT | LT condition not met */
  CONDITION_NOT_MET: 0,
  /** Expiration time was set or updated */
  UPDATED: 1,
  /** Field deleted because the specified expiration time is in the past */
  DELETED: 2
} as const;

export type HashExpiration = typeof HASH_EXPIRATION[keyof typeof HASH_EXPIRATION];

export default {
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    fields: RedisVariadicArgument,
    seconds: number,
    mode?: 'NX' | 'XX' | 'GT' | 'LT'
  ) {
    parser.push('HEXPIRE');
    parser.pushKey(key);
    parser.push(seconds.toString());
    
    if (mode) {
      parser.push(mode);
    }

    parser.push('FIELDS');

    parser.pushVariadicWithLength(fields);
  },
  transformReply: undefined as unknown as () => ArrayReply<HashExpiration>
} as const satisfies Command;
