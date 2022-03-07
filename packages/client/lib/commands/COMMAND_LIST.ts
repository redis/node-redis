import { RedisCommandArguments } from '.';

export const IS_READ_ONLY = true;

export enum FilterBy {
    MODULE = 'MODULE',
    ACLCAT = 'ACLCAT',
    PATTERN = 'PATTERN'
}

interface Filter {
    filterBy: FilterBy;
    value: string;
}


export function transformArguments(filter?: Filter): RedisCommandArguments {
    const args = ['COMMAND', 'LIST'];

    if (filter) {
        args.push(
            'FILTERBY',
            filter.filterBy,
            filter.value
        );
    }

    return args;
}

export declare function transformReply(): Array<string>;
