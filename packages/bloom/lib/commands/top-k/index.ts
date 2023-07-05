import ADD from './ADD';
import COUNT from './COUNT';
import INCRBY from './INCRBY';
import INFO from './INFO';
import LIST_WITHCOUNT from './LIST_WITHCOUNT';
import LIST from './LIST';
import QUERY from './QUERY';
import RESERVE from './RESERVE';

type ADD = typeof import('./ADD').default;
type COUNT = typeof import('./COUNT').default;
type INCRBY = typeof import('./INCRBY').default;
type INFO = typeof import('./INFO').default;
type LIST_WITHCOUNT = typeof import('./LIST_WITHCOUNT').default;
type LIST = typeof import('./LIST').default;
type QUERY = typeof import('./QUERY').default;
type RESERVE = typeof import('./RESERVE').default;

export default {
  ADD: ADD as ADD,
  add: ADD as ADD,
  COUNT: COUNT as COUNT,
  count: COUNT as COUNT,
  INCRBY: INCRBY as INCRBY,
  incrBy: INCRBY as INCRBY,
  INFO: INFO as INFO,
  info: INFO as INFO,
  LIST_WITHCOUNT: LIST_WITHCOUNT as LIST_WITHCOUNT,
  listWithCount: LIST_WITHCOUNT as LIST_WITHCOUNT,
  LIST: LIST as LIST,
  list: LIST as LIST,
  QUERY: QUERY as QUERY,
  query: QUERY as QUERY,
  RESERVE: RESERVE as RESERVE,
  reserve: RESERVE as RESERVE
};
