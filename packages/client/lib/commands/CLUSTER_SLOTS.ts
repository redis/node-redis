import { CommandParser } from '../client/parser';
import { TuplesReply, BlobStringReply, NumberReply, ArrayReply, UnwrapReply, Command } from '../RESP/types';

type RawNode = TuplesReply<[
  host: BlobStringReply,
  port: NumberReply,
  id: BlobStringReply
]>;

type ClusterSlotsRawReply = ArrayReply<[
  from: NumberReply,
  to: NumberReply,
  master: RawNode,
  ...replicas: Array<RawNode>
]>;

export type ClusterSlotsNode = ReturnType<typeof transformNode>;

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Returns information about which Redis Cluster node handles which hash slots
   * @param parser - The Redis command parser
   */
  parseCommand(parser: CommandParser) {
    parser.push('CLUSTER', 'SLOTS');
  },
  transformReply(reply: UnwrapReply<ClusterSlotsRawReply>) {
    return reply.map(([from, to, master, ...replicas]) => ({
      from,
      to,
      master: transformNode(master),
      replicas: replicas.map(transformNode)
    }));
  }
} as const satisfies Command;

function transformNode(node: RawNode) {
  const [host, port, id] = node as unknown as UnwrapReply<typeof node>;
  return {
    host,
    port,
    id
  };
}
