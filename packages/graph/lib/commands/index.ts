import CONFIG_GET from './CONFIG_GET';
import CONFIG_SET from './CONFIG_SET';;
import DELETE from './DELETE';
import EXPLAIN from './EXPLAIN';
import LIST from './LIST';
import PROFILE from './PROFILE';
import QUERY_RO from './QUERY_RO';
import QUERY from './QUERY';
import SLOWLOG from './SLOWLOG';

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
