import * as CONFIG_GET from './CONFIG_GET';
import * as CONFIG_SET from './CONFIG_SET';;
import * as DELETE from './DELETE';
import * as EXPLAIN from './EXPLAIN';
import * as LIST from './LIST';
import * as PROFILE from './PROFILE';
import * as QUERY_RO from './QUERY_RO';
import * as QUERY from './QUERY';
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
    QUERY_RO,
    queryRo: QUERY_RO,
    QUERY,
    query: QUERY,
    SLOWLOG,
    slowLog: SLOWLOG
};

export function pushQueryArguments(
    args: RedisCommandArguments,
    graph: RedisCommandArgument,
    query: RedisCommandArgument,
    timeout?: number
): RedisCommandArguments {
    args.push(
        graph,
        query
    );

    if (timeout !== undefined) {
        args.push(timeout.toString());
    }

    return args;
}