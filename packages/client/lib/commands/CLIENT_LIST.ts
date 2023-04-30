import { RedisArgument, VerbatimStringReply, Command } from '../RESP/types';
import { pushVariadicArguments } from './generic-transformers';
import CLIENT_INFO, { ClientInfoReply } from './CLIENT_INFO';

export interface ListFilterType {
  TYPE: 'NORMAL' | 'MASTER' | 'REPLICA' | 'PUBSUB';
  ID?: never;
}

export interface ListFilterId {
  ID: Array<RedisArgument>;
  TYPE?: never;
}

export type ListFilter = ListFilterType | ListFilterId;

export default {
  IS_READ_ONLY: true,
  transformArguments(filter?: ListFilter) {
    let args: Array<RedisArgument> = ['CLIENT', 'LIST'];

    if (filter) {
      if (filter.TYPE !== undefined) {
        args.push('TYPE', filter.TYPE);
      } else {
        args.push('ID');
        args = pushVariadicArguments(args, filter.ID);
      }
    }

    return args;
  },
  transformReply(rawReply: VerbatimStringReply): Array<ClientInfoReply> {
    const split = rawReply.toString().split('\n'),
      length = split.length - 1,
      reply: Array<ClientInfoReply> = [];
    for (let i = 0; i < length; i++) {
      reply.push(CLIENT_INFO.transformReply(split[i] as VerbatimStringReply));
    }

    return reply;
  }
} as const satisfies Command;
