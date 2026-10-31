import { CommandParser } from '../client/parser';
import { Command, NumberReply, RedisArgument } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';

export interface SAddExOptions {
  expiration?: {
    type: 'EX' | 'PX' | 'EXAT' | 'PXAT';
    value: number;
  } | 'KEEPTTL';
  mode?: 'MNX' | 'MXX';
}

export default {
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    members: RedisVariadicArgument,
    options?: SAddExOptions
  ) {
    parser.push('SADDEX');
    parser.pushKey(key);

    if (options?.mode) {
      parser.push(options.mode);
    }

    if (options?.expiration) {
      if (typeof options.expiration === 'string') {
        parser.push(options.expiration);
      } else {
        parser.push(
          options.expiration.type,
          options.expiration.value.toString()
        );
      }
    }

    parser.push('MEMBERS');
    parser.pushVariadicWithLength(members);
  },
  transformReply: undefined as unknown as () => NumberReply<0 | 1>
} as const satisfies Command;
