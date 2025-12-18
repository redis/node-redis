import { setTimeout } from "node:timers/promises";

import { ActionRequest, ActionStatus, IFaultInjectorClient } from "./types";
import ProxyController from "../proxy/proxy-controller";

const TOTAL_SLOTS = 16384;

interface MigrateParameters {
  /** 'all' = source loses ALL its slots, 'half' = source loses half its slots */
  slot_migration: "all" | "half";

  /** 'existing' = target node visible in CLUSTER SLOTS, 'new' = hidden node */
  destination_type: "existing" | "new";
}

export class ProxiedFaultInjectorClientForCluster
  implements IFaultInjectorClient
{
  constructor(private readonly proxyController: ProxyController) {}

  async triggerAction(action: ActionRequest): Promise<ActionStatus> {
    switch (action.type) {
      case "migrate": {
        return this.triggerMigrate(
          action.parameters as unknown as MigrateParameters
        );
      }
      default:
        throw new Error(`Action ${action.type} not implemented`);
    }
  }

  async getProxyNodes() {
    const nodes = await this.proxyController.getNodes();
    return nodes.ids.map(parseNodeId);
  }

  async updateClusterSlots(nodes: ProxyNode[]) {
    return this.proxyController.addInterceptor(
      "cluster",
      "*2\r\n$7\r\ncluster\r\n$5\r\nslots\r\n",
      buildClusterSlotsResponse(nodes, "raw"),
      "raw"
    );
  }

  /**
   * Simulates a Redis cluster slot migration by sending SMIGRATING and SMIGRATED
   * push notifications to the client.
   *
   * The migration process:
   * 1. Retrieves cluster nodes and their connections
   * 2. Calculates the slot range to migrate based on `slotMigration` parameter:
   *    - 'all': migrates all slots from the first node (0 to totalSlots/N - 1)
   *    - 'half': migrates half the slots from the first node (0 to totalSlots/N/2 - 1)
   * 3. Sends SMIGRATING notification to the source node's first connection
   * 4. Waits 2 seconds to simulate maintenance delay
   * 5. Determines destination node based on `destinationType` parameter:
   *    - 'new': uses a node with no active connections (hidden node)
   *    - 'existing': uses the last node in the cluster (visible in CLUSTER SLOTS)
   * 6. Sends SMIGRATED notification to complete the migration
   *
   * @param params - Migration configuration parameters
   * @param params.slot_migration - Determines how many slots to migrate: 'all' or 'half'
   * @param params.destination_type - Determines target node type: 'existing' or 'new'
   * @private
   */
  private async triggerMigrate(
    params: MigrateParameters
  ): Promise<ActionStatus> {
    const [nodes, connections] = await Promise.all([
      this.getProxyNodes(),
      this.proxyController.getConnections(),
    ]);

    /**
     * This is an assumption that there is at possibility of at least one node with no connections
     * However for this to work correctly the cluster client should NOT be using the `minimizeConnections`
     */
    const nodeWithoutConnections = nodes.find((node) => {
      const connIds = connections[node.id];
      return !connIds || connIds.length === 0;
    });

    const visibleNodesCount = nodeWithoutConnections
      ? nodes.length - 1
      : nodes.length;

    const shouldMigrateHalfSlots = params.slot_migration === "half";
    const slots = shouldMigrateHalfSlots
      ? `0-${Math.floor(TOTAL_SLOTS / visibleNodesCount / 2) - 1}`
      : `0-${Math.floor(TOTAL_SLOTS / visibleNodesCount) - 1}`;

    const sMigratingNotification = buildSMigratingNotification(slots);

    const sourceNode = nodes[0];

    const migratingResult = await this.proxyController.sendToClient(
      connections[sourceNode.id][0],
      sMigratingNotification
    );

    if (!migratingResult.success) {
      throw new Error(
        `[Proxy] Failed to send SMIGRATING notification: ${migratingResult.error}`
      );
    }

    // 2. Simulate maintenance delay
    await setTimeout(2_000);

    const isNewDestination = params.destination_type === "new";

    if (isNewDestination && !nodeWithoutConnections) {
      throw new Error(`[Proxy] No node with no connections`);
    }

    const destinationNode = isNewDestination
      ? nodeWithoutConnections!
      : nodes.at(-1)!; // Get the last node as the destination

    if (!destinationNode) {
      throw new Error(`[Proxy] No destination node`);
    }

    const sMigratedNotification = buildSMigratedNotification([
      {
        targetNode: destinationNode,
        slotRanges: slots,
      },
    ]);

    const migratedResult = await this.proxyController.sendToClient(
      connections[sourceNode.id][0],
      sMigratedNotification
    );

    if (!migratedResult.success) {
      throw new Error(
        `[Proxy] Failed to send SMIGRATED notification: ${migratedResult.error}`
      );
    }

    return {
      status: "success",
      error: null,
      output: "Migration completed!",
    };
  }
}

interface ProxyNode {
  id: string;
  host: string;
  port: number;
  proxyPort: number;
}

const parseNodeId = (id: string): ProxyNode => {
  const [rest, port] = id.split("@");
  const [host, proxyPort] = rest.split(":");

  return {
    id,
    host,
    port: Number(port),
    proxyPort: Number(proxyPort),
  };
};

const buildSMigratedNotification = (
  movedSlotsByDestination: Array<{
    targetNode: { host: string; port: number };
    slotRanges: string; // e.g., "0-5460" or "0-100,200-300,500"
  }>,
  seqId: number = 1,
  encoding: "base64" | "raw" = "base64"
): string => {
  if (movedSlotsByDestination.length === 0) {
    throw new Error("No slots to migrate");
  }

  const entries = movedSlotsByDestination.map(({ targetNode, slotRanges }) => {
    const hostPort = `${targetNode.host}:${targetNode.port}`;
    return `*2\r\n+${hostPort}\r\n+${slotRanges}\r\n`;
  });

  const response = `>3\r\n+SMIGRATED\r\n:${seqId}\r\n*${
    movedSlotsByDestination.length
  }\r\n${entries.join("")}`;

  return encoding === "raw"
    ? response
    : Buffer.from(response).toString(encoding);
};

const buildClusterSlotsResponse = (
  nodes: ProxyNode[],
  encoding: "base64" | "raw" = "base64"
): string => {
  const TOTAL_SLOTS = 16384;
  const slotSize = Math.floor(TOTAL_SLOTS / nodes.length);

  let current = -1;
  const slots = nodes.map((node, i) => {
    const from = current + 1;
    const to = i === nodes.length - 1 ? 16383 : current + slotSize;
    current = to;

    // Use proxyPort as the port clients connect to
    const host = node.host;
    const port = node.port;
    const nodeId = `proxy-${port}`;

    return `*3\r\n:${from}\r\n:${to}\r\n*3\r\n$${host.length}\r\n${host}\r\n:${port}\r\n$${nodeId.length}\r\n${nodeId}\r\n`;
  });

  return encoding === "raw"
    ? `*${nodes.length}\r\n${slots.join("")}`
    : Buffer.from(`*${nodes.length}\r\n${slots.join("")}`).toString(encoding);
};

const buildSMigratingNotification = (
  slotRanges: string,
  seqId: number = 1,
  encoding: "base64" | "raw" = "base64"
) => {
  const response = `>3\r\n+SMIGRATING\r\n:${seqId}\r\n+${slotRanges}\r\n`;

  if (encoding === "raw") {
    return response;
  }

  return Buffer.from(response).toString(encoding);
};
