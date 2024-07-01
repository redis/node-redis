import { RedisArgument, NumberReply, Command } from '../RESP/types';

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
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments(filters: ClientKillFilter | Array<ClientKillFilter>) {
    const args = ['CLIENT', 'KILL'];

    if (Array.isArray(filters)) {
      for (const filter of filters) {
        pushFilter(args, filter);
      }
    } else {
      pushFilter(args, filters);
    }

    return args;
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;

function pushFilter(args: Array<RedisArgument>, filter: ClientKillFilter): void {
  if (filter === CLIENT_KILL_FILTERS.SKIP_ME) {
    args.push('SKIPME');
    return;
  }

  args.push(filter.filter);

  switch (filter.filter) {
    case CLIENT_KILL_FILTERS.ADDRESS:
      args.push(filter.address);
      break;

    case CLIENT_KILL_FILTERS.LOCAL_ADDRESS:
      args.push(filter.localAddress);
      break;

    case CLIENT_KILL_FILTERS.ID:
      args.push(
        typeof filter.id === 'number' ?
          filter.id.toString() :
          filter.id
      );
      break;

    case CLIENT_KILL_FILTERS.TYPE:
      args.push(filter.type);
      break;

    case CLIENT_KILL_FILTERS.USER:
      args.push(filter.username);
      break;

    case CLIENT_KILL_FILTERS.SKIP_ME:
      args.push(filter.skipMe ? 'yes' : 'no');
      break;
    
    case CLIENT_KILL_FILTERS.MAXAGE:
      args.push(filter.maxAge.toString());
      break;
  }
}
