import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export const CLUSTER_SLOT_STATES = {
  IMPORTING: 'IMPORTING',
  MIGRATING: 'MIGRATING',
  STABLE: 'STABLE',
  NODE: 'NODE'
} as const;

export type ClusterSlotState = typeof CLUSTER_SLOT_STATES[keyof typeof CLUSTER_SLOT_STATES];

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, slot: number, state: ClusterSlotState, nodeId?: RedisArgument) {
    parser.pushVariadic(['CLUSTER', 'SETSLOT', slot.toString(), state]);

    if (nodeId) {
      parser.push(nodeId);
    }
  },
  transformArguments(slot: number, state: ClusterSlotState, nodeId?: RedisArgument) { return [] },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
