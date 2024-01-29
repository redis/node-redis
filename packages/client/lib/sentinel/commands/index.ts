import { RedisCommands } from '../../RESP/types';
import SENTINEL_MASTER from './SENTINEL_MASTER';
import SENTINEL_MONITOR from './SENTINEL_MONITOR';
import SENTINEL_REPLICAS from './SENTINEL_REPLICAS';
import SENTINEL_SENTINELS from './SENTINEL_SENTINELS';
import SENTINEL_SET from './SENTINEL_SET';

export default {
  SENTINEL_SENTINELS,
  sentinelSentinels: SENTINEL_SENTINELS,
  SENTINEL_MASTER,
  sentinelMaster: SENTINEL_MASTER,
  SENTINEL_REPLICAS,
  sentinelReplicas: SENTINEL_REPLICAS,
  SENTINEL_MONITOR,
  sentinelMonitor: SENTINEL_MONITOR,
  SENTINEL_SET,
  sentinelSet: SENTINEL_SET
} as const satisfies RedisCommands;
