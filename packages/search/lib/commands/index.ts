import _LIST from './_LIST';
import ALTER from './ALTER';
import AGGREGATE_WITHCURSOR from './AGGREGATE_WITHCURSOR';
import AGGREGATE from './AGGREGATE';
import ALIASADD from './ALIASADD';
import ALIASDEL from './ALIASDEL';
import ALIASUPDATE from './ALIASUPDATE';
import CONFIG_GET from './CONFIG_GET';
import CONFIG_SET from './CONFIG_SET';
import CREATE from './CREATE';
import CURSOR_DEL from './CURSOR_DEL';
import CURSOR_READ from './CURSOR_READ';
import DICTADD from './DICTADD';
import DICTDEL from './DICTDEL';
import DICTDUMP from './DICTDUMP';
import DROPINDEX from './DROPINDEX';
import EXPLAIN from './EXPLAIN';
import EXPLAINCLI from './EXPLAINCLI';
import HYBRID from './HYBRID';
import INFO from './INFO';
import PROFILESEARCH from './PROFILE_SEARCH';
import PROFILEAGGREGATE from './PROFILE_AGGREGATE';
import SEARCH_NOCONTENT from './SEARCH_NOCONTENT';
import SEARCH from './SEARCH';
import SPELLCHECK from './SPELLCHECK';
import SUGADD from './SUGADD';
import SUGDEL from './SUGDEL';
import SUGGET_WITHPAYLOADS from './SUGGET_WITHPAYLOADS';
import SUGGET_WITHSCORES_WITHPAYLOADS from './SUGGET_WITHSCORES_WITHPAYLOADS';
import SUGGET_WITHSCORES from './SUGGET_WITHSCORES';
import SUGGET from './SUGGET';
import SUGLEN from './SUGLEN';
import SYNDUMP from './SYNDUMP';
import SYNUPDATE from './SYNUPDATE';
import TAGVALS from './TAGVALS';

export default {
  _LIST,
  _list: _LIST,
  ALTER,
  alter: ALTER,
  AGGREGATE_WITHCURSOR,
  aggregateWithCursor: AGGREGATE_WITHCURSOR,
  AGGREGATE,
  aggregate: AGGREGATE,
  ALIASADD,
  aliasAdd: ALIASADD,
  ALIASDEL,
  aliasDel: ALIASDEL,
  ALIASUPDATE,
  aliasUpdate: ALIASUPDATE,
  /**
   * @deprecated Redis >=8 uses the standard CONFIG command 
   */
  CONFIG_GET,
  /**
   * @deprecated Redis >=8 uses the standard CONFIG command 
   */
  configGet: CONFIG_GET,
  /**
   * @deprecated Redis >=8 uses the standard CONFIG command 
   */
  CONFIG_SET,
  /**
   * @deprecated Redis >=8 uses the standard CONFIG command 
   */
  configSet: CONFIG_SET,
  CREATE,
  create: CREATE,
  CURSOR_DEL,
  cursorDel: CURSOR_DEL,
  CURSOR_READ,
  cursorRead: CURSOR_READ,
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
  HYBRID,
  hybrid: HYBRID,
  INFO,
  info: INFO,
  PROFILESEARCH,
  profileSearch: PROFILESEARCH,
  PROFILEAGGREGATE,
  profileAggregate: PROFILEAGGREGATE,
  SEARCH_NOCONTENT,
  searchNoContent: SEARCH_NOCONTENT,
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
