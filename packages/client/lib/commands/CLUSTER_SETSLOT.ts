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
  /**
   * Assigns a hash slot to a specific Redis Cluster node
   * @param parser - The Redis command parser
   * @param slot - The slot number to assign
   * @param state - The state to set for the slot (IMPORTING, MIGRATING, STABLE, NODE)
   * @param nodeId - Node ID (required for IMPORTING, MIGRATING, and NODE states)
   */
  parseCommand(parser: CommandParser, slot: number, state: ClusterSlotState, nodeId?: RedisArgument) {
    parser.push('CLUSTER', 'SETSLOT', slot.toString(), state);

    if (nodeId) {
      parser.push(nodeId);
    }
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
