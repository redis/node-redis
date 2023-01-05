import { RedisCommandArguments, RedisCommandArgument } from '.';
import { ClientInfoReply, transformClientInfoReply } from './generic-transformers';

interface ListFilterType {
    type: 'normal' | 'master' | 'replica' | 'pubsub';
    id?: never;
}
interface ListFilterId {
    id: Array<RedisCommandArgument>;
    type?: never;
}

export type ListFilter = ListFilterType | ListFilterId;

export function transformArguments(filter?: ListFilter): RedisCommandArguments {
    const args: RedisCommandArguments = ['CLIENT', 'LIST'];

    if (filter) {
        if (isFilterType(filter)) {
            args.push('TYPE', filter.type);
        }

        if (isFilterId(filter)) {
            args.push('ID', ...filter.id);
        }
    }

    return args;
}

function isFilterType(filter?: ListFilter): filter is ListFilterType {
    return (filter as ListFilterType)?.type !== undefined;
}

function isFilterId(filter?: ListFilter): filter is ListFilterId {
    return (filter as ListFilterId)?.id !== undefined;
}

export function transformReply(reply: string): Array<ClientInfoReply> {
    const REGEX = /([^\n]+)/g;
    const items = [...reply.matchAll(REGEX)];
    return items.map((item) => transformClientInfoReply(item[1]));
}
