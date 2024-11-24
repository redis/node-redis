import { CommandParser } from '../client/parser';
import { RedisArgument, VerbatimStringReply, Command } from '../RESP/types';
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
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, filter?: ListFilter) {
    parser.push('CLIENT', 'LIST');
    if (filter) {
      if (filter.TYPE !== undefined) {
        parser.push('TYPE', filter.TYPE);
      } else {
        parser.push('ID');
        parser.pushVariadic(filter.ID);
      }
    }
  },
  transformReply(rawReply: VerbatimStringReply): Array<ClientInfoReply> {
    const split = rawReply.toString().split('\n'),
      length = split.length - 1,
      reply: Array<ClientInfoReply> = [];
    for (let i = 0; i < length; i++) {
      reply.push(CLIENT_INFO.transformReply(split[i] as unknown as VerbatimStringReply));
    }

    return reply;
  }
} as const satisfies Command;
