import * as _LIST from './_LIST';
import * as AGGREGATE from './AGGREGATE';
import * as ALIASADD from './ALIASADD';
import * as ALIASDEL from './ALIASDEL';
import * as ALIASUPDATE from './ALIASUPDATE';
import * as CONFIG_GET from './CONFIG_GET';
import * as CONFIG_SET from './CONFIG_SET';
import * as CREATE from './CREATE';
import * as DICTADD from './DICTADD';
import * as DICTDEL from './DICTDEL';
import * as DICTDUMP from './DICTDUMP';
import * as DROPINDEX from './DROPINDEX';
import * as EXPLAIN from './EXPLAIN';
import * as EXPLAINCLI from './EXPLAINCLI';
import * as INFO from './INFO';
// import * as PROFILE from './PROFILE';
import * as SEARCH from './SEARCH';
import * as SPELLCHECK from './SPELLCHECK';
import * as SUGADD from './SUGADD';
import * as SUGDEL from './SUGDEL';
import * as SUGGET_WITHPAYLOADS from './SUGGET_WITHPAYLOADS';
import * as SUGGET_WITHSCORES_WITHPAYLOADS from './SUGGET_WITHSCORES_WITHPAYLOADS';
import * as SUGGET_WITHSCORES from './SUGGET_WITHSCORES';
import * as SUGGET from './SUGGET';
import * as SUGLEN from './SUGLEN';
import * as SYNDUMP from './SYNDUMP';
import * as SYNUPDATE from './SYNUPDATE';
import * as TAGVALS from './TAGVALS';
import { RedisCommandArguments } from '@redis/client/dist/lib/commands';

export default {
    _LIST,
    _list: _LIST,
    AGGREGATE,
    aggregate: AGGREGATE,
    ALIASADD,
    aliasAdd: ALIASADD,
    ALIASDEL,
    aliasDel: ALIASDEL,
    ALIASUPDATE,
    aliasUpdate: ALIASUPDATE,
    CONFIG_GET,
    configGet: CONFIG_GET,
    CONFIG_SET,
    configSet: CONFIG_SET,
    CREATE,
    create: CREATE,
    DICTADD,
    dictAdd: DICTADD,
    DICTDEL,
    dictDel: DICTDEL,
    DICTDUMP,
    dictDump: DICTDUMP,
    DROPINDEX,
    dropIndex: DROPINDEX,
    EXPLAIN,
    explain: EXPLAIN,
    EXPLAINCLI,
    explainCli: EXPLAINCLI,
    INFO,
    info: INFO,
    // PROFILE,
    // profile: PROFILE,
    SEARCH,
    search: SEARCH,
    SPELLCHECK,
    spellCheck: SPELLCHECK,
    SUGADD,
    sugAdd: SUGADD,
    SUGDEL,
    sugDel: SUGDEL,
    SUGGET_WITHPAYLOADS,
    sugGetWithPayloads: SUGGET_WITHPAYLOADS,
    SUGGET_WITHSCORES_WITHPAYLOADS,
    sugGetWithScoresWithPayloads: SUGGET_WITHSCORES_WITHPAYLOADS,
    SUGGET_WITHSCORES,
    sugGetWithScores: SUGGET_WITHSCORES,
    SUGGET,
    sugGet: SUGGET,
    SUGLEN,
    sugLen: SUGLEN,
    SYNDUMP,
    synDump: SYNDUMP,
    SYNUPDATE,
    synUpdate: SYNUPDATE,
    TAGVALS,
    tagVals: TAGVALS
};

export enum RedisSearchLanguages {
    ARABIC = 'Arabic',
    BASQUE = 'Basque',
    CATALANA = 'Catalan',
    DANISH = 'Danish',
    DUTCH = 'Dutch',
    ENGLISH = 'English',
    FINNISH = 'Finnish',
    FRENCH = 'French',
    GERMAN = 'German',
    GREEK = 'Greek',
    HUNGARIAN = 'Hungarian',
    INDONESAIN = 'Indonesian',
    IRISH = 'Irish',
    ITALIAN = 'Italian',
    LITHUANIAN = 'Lithuanian',
    NEPALI = 'Nepali',
    NORWEIGAN = 'Norwegian',
    PORTUGUESE = 'Portuguese',
    ROMANIAN = 'Romanian',
    RUSSIAN = 'Russian',
    SPANISH = 'Spanish',
    SWEDISH = 'Swedish',
    TAMIL = 'Tamil',
    TURKISH = 'Turkish',
    CHINESE = 'Chinese'
}

export type PropertyName = `${'@' | '$.'}${string}`;

export type SortByOptions = PropertyName | {
    BY: PropertyName;
    DIRECTION?: 'ASC' | 'DESC';
};

function pushSortByProperty(args: RedisCommandArguments, sortBy: SortByOptions): void {
    if (typeof sortBy === 'string') {
        args.push(sortBy);
    } else {
        args.push(sortBy.BY);

        if (sortBy.DIRECTION) {
            args.push(sortBy.DIRECTION);
        }
    }
}

export function pushSortByArguments(args: RedisCommandArguments, name: string, sortBy: SortByOptions | Array<SortByOptions>): RedisCommandArguments {
    const lengthBefore = args.push(
        name,
        '' // will be overwritten
    );

    if (Array.isArray(sortBy)) {
        for (const field of sortBy) {
            pushSortByProperty(args, field);
        }
    } else {
        pushSortByProperty(args, sortBy);
    }

    args[lengthBefore - 1] = (args.length - lengthBefore).toString();

    return args;
}

export function pushArgumentsWithLength(args: RedisCommandArguments, fn: (args: RedisCommandArguments) => void): RedisCommandArguments {
    const lengthIndex = args.push('') - 1;
    fn(args);
    args[lengthIndex] = (args.length - lengthIndex - 1).toString();
    return args;
}
