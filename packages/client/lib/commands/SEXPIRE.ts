import { CommandParser } from '../client/parser';
import { ArrayReply, Command, RedisArgument } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';

export const SET_EXPIRATION = {
  /** The member does not exist */
  MEMBER_NOT_EXISTS: -2,
  /** Specified NX | XX | GT | LT condition not met */
  CONDITION_NOT_MET: 0,
  /** Expiration time was set or updated */
  UPDATED: 1,
  /** Member deleted because the specified expiration time is in the past */
  DELETED: 2
} as const;

export type SetExpiration = typeof SET_EXPIRATION[keyof typeof SET_EXPIRATION];

export default {
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    members: RedisVariadicArgument,
    seconds: number,
    mode?: 'NX' | 'XX' | 'GT' | 'LT'
  ) {
    parser.push('SEXPIRE');
    parser.pushKey(key);
    parser.push(seconds.toString());

    if (mode) {
      parser.push(mode);
    }

    parser.push('MEMBERS');
    parser.pushVariadicWithLength(members);
  },
  transformReply: undefined as unknown as () => ArrayReply<SetExpiration>
} as const satisfies Command;
