
import { RedisModules } from '../RESP/types';
import sentinel from './commands';

export default {
  sentinel
} as const satisfies RedisModules;
