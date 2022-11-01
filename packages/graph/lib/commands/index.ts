import * as CONFIG_GET from './CONFIG_GET';
import * as CONFIG_SET from './CONFIG_SET';;
import * as DELETE from './DELETE';
import * as EXPLAIN from './EXPLAIN';
import * as LIST from './LIST';
import * as PROFILE from './PROFILE';
import * as QUERY from './QUERY';
import * as RO_QUERY from './RO_QUERY';
import * as SLOWLOG from './SLOWLOG';
import { RedisCommandArgument, RedisCommandArguments } from '@redis/client/dist/lib/commands';

export default {
    CONFIG_GET,
    configGet: CONFIG_GET,
    CONFIG_SET,
    configSet: CONFIG_SET,
    DELETE,
    delete: DELETE,
    EXPLAIN,
    explain: EXPLAIN,
    LIST,
    list: LIST,
    PROFILE,
    profile: PROFILE,
    QUERY,
    query: QUERY,
    RO_QUERY,
    roQuery: RO_QUERY,
    SLOWLOG,
    slowLog: SLOWLOG
};

type QueryParam = null | string | number | boolean | QueryParams | Array<QueryParam>;

type QueryParams = {
    [key: string]: QueryParam;
};

export interface QueryOptions {
    params?: QueryParams;
    TIMEOUT?: number;
}

export type QueryOptionsBackwardCompatible = QueryOptions | number;

export function pushQueryArguments(
    args: RedisCommandArguments,
    graph: RedisCommandArgument,
    query: RedisCommandArgument,
    options?: QueryOptionsBackwardCompatible,
    compact?: boolean
): RedisCommandArguments {
    args.push(graph);

    if (typeof options === 'number') {
        args.push(query);
        pushTimeout(args, options);
    } else {
        args.push(
            options?.params ?
                `CYPHER ${queryParamsToString(options.params)} ${query}` :
                query
        );

        if (options?.TIMEOUT !== undefined) {
            pushTimeout(args, options.TIMEOUT);
        }
    }

    if (compact) {
        args.push('--compact');
    }

    return args;
}

function pushTimeout(args: RedisCommandArguments, timeout: number): void {
    args.push('TIMEOUT', timeout.toString());
}

function queryParamsToString(params: QueryParams): string {
    const parts = [];
    for (const [key, value] of Object.entries(params)) {
        parts.push(`${key}=${queryParamToString(value)}`);
    }
    return parts.join(' ');
}

function queryParamToString(param: QueryParam): string {
    if (param === null) {
        return 'null';
    }

    switch (typeof param) {
        case 'string':
            return `"${param.replace(/["\\]/g, '\\$&')}"`;

        case 'number':
        case 'boolean':
            return param.toString();
    }

    if (Array.isArray(param)) {
        return `[${param.map(queryParamToString).join(',')}]`;
    } else if (typeof param === 'object') {
        const body = [];
        for (const [key, value] of Object.entries(param)) {
            body.push(`${key}:${queryParamToString(value)}`);
        }
        return `{${body.join(',')}}`;
    } else {
        throw new TypeError(`Unexpected param type ${typeof param} ${param}`)
    }
}
