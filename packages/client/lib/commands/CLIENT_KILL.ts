import { CommandParser } from '../client/parser';
import { NumberReply, Command } from '../RESP/types';

export const CLIENT_KILL_FILTERS = {
  ADDRESS: 'ADDR',
  LOCAL_ADDRESS: 'LADDR',
  ID: 'ID',
  TYPE: 'TYPE',
  USER: 'USER',
  SKIP_ME: 'SKIPME',
  MAXAGE: 'MAXAGE'
} as const;

type CLIENT_KILL_FILTERS = typeof CLIENT_KILL_FILTERS;

export interface ClientKillFilterCommon<T extends CLIENT_KILL_FILTERS[keyof CLIENT_KILL_FILTERS]> {
  filter: T;
}

export interface ClientKillAddress extends ClientKillFilterCommon<CLIENT_KILL_FILTERS['ADDRESS']> {
  address: `${string}:${number}`;
}

export interface ClientKillLocalAddress extends ClientKillFilterCommon<CLIENT_KILL_FILTERS['LOCAL_ADDRESS']> {
  localAddress: `${string}:${number}`;
}

export interface ClientKillId extends ClientKillFilterCommon<CLIENT_KILL_FILTERS['ID']> {
  id: number | `${number}`;
}

export interface ClientKillType extends ClientKillFilterCommon<CLIENT_KILL_FILTERS['TYPE']> {
  type: 'normal' | 'master' | 'replica' | 'pubsub';
}

export interface ClientKillUser extends ClientKillFilterCommon<CLIENT_KILL_FILTERS['USER']> {
  username: string;
}

export type ClientKillSkipMe = CLIENT_KILL_FILTERS['SKIP_ME'] | (ClientKillFilterCommon<CLIENT_KILL_FILTERS['SKIP_ME']> & {
  skipMe: boolean;
});

export interface ClientKillMaxAge extends ClientKillFilterCommon<CLIENT_KILL_FILTERS['MAXAGE']> {
  maxAge: number;
}

export type ClientKillFilter = ClientKillAddress | ClientKillLocalAddress | ClientKillId | ClientKillType | ClientKillUser | ClientKillSkipMe | ClientKillMaxAge;

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Closes client connections matching the specified filters
   * @param parser - The Redis command parser
   * @param filters - One or more filters to match client connections to kill
   */
  parseCommand(parser: CommandParser, filters: ClientKillFilter | Array<ClientKillFilter>) {
    parser.push('CLIENT', 'KILL');

    if (Array.isArray(filters)) {
      for (const filter of filters) {
        pushFilter(parser, filter);
      }
    } else {
      pushFilter(parser, filters);
    }

  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;

function pushFilter(parser: CommandParser, filter: ClientKillFilter): void {
  if (filter === CLIENT_KILL_FILTERS.SKIP_ME) {
    parser.push('SKIPME');
    return;
  }

  parser.push(filter.filter);

  switch (filter.filter) {
    case CLIENT_KILL_FILTERS.ADDRESS:
      parser.push(filter.address);
      break;

    case CLIENT_KILL_FILTERS.LOCAL_ADDRESS:
      parser.push(filter.localAddress);
      break;

    case CLIENT_KILL_FILTERS.ID:
      parser.push(
        typeof filter.id === 'number' ?
          filter.id.toString() :
          filter.id
      );
      break;

    case CLIENT_KILL_FILTERS.TYPE:
      parser.push(filter.type);
      break;

    case CLIENT_KILL_FILTERS.USER:
      parser.push(filter.username);
      break;

    case CLIENT_KILL_FILTERS.SKIP_ME:
      parser.push(filter.skipMe ? 'yes' : 'no');
      break;
    
    case CLIENT_KILL_FILTERS.MAXAGE:
      parser.push(filter.maxAge.toString());
      break;
  }
}
