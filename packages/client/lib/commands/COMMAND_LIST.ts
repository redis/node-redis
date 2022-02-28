import { RedisCommandArguments } from '.';

export const IS_READ_ONLY = true;

export enum FilterBy {
    MODULE = 'MODULE',
    ACLCAT = 'ACLCAT',
    PATTERN = 'PATTERN',
}

export function transformArguments(filterBy?: FilterBy, value?: String): RedisCommandArguments {
    const args = ['COMMAND', 'LIST'];

    if (filterBy != null && value) {
        args.push('FILTERBY');
        args.push(filterBy);
        args.push(value.toString());
    }

    return args;
}

export declare function transformReply(): Array<String>;
