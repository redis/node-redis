import { CommandParser } from '../client/parser';
import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';

export const CLUSTER_SLOT_STATES = {
  IMPORTING: 'IMPORTING',
  MIGRATING: 'MIGRATING',
  STABLE: 'STABLE',
  NODE: 'NODE'
} as const;

export type ClusterSlotState = typeof CLUSTER_SLOT_STATES[keyof typeof CLUSTER_SLOT_STATES];

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, slot: number, state: ClusterSlotState, nodeId?: RedisArgument) {
    parser.push('CLUSTER', 'SETSLOT', slot.toString(), state);

    if (nodeId) {
      parser.push(nodeId);
    }
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
