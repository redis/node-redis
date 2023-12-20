import { RedisModules } from '@redis/client';
import sentinel from './commands';

export default {
  sentinel
} as const satisfies RedisModules