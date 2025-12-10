import { randomUUID } from "node:crypto";
import { setTimeout } from "node:timers/promises";

import { ActionRequest, ActionStatus, IFaultInjectorClient } from "./types";
import ProxyController from "../proxy/proxy-controller";

const TOTAL_SLOTS = 16384;

export class ProxiedFaultInjectorClientForCluster
  implements IFaultInjectorClient
{
  private readonly results = new Map<string, ActionStatus>();

  constructor(private readonly proxyController: ProxyController) {}

  async triggerAction<T extends { action_id: string }>(
    action: ActionRequest
  ): Promise<T> {
    const actionId = randomUUID();

    switch (action.type) {
      case "failover": {
        const result = await this.triggerFailover();
        this.results.set(actionId, result);
        break;
      }
      default:
        throw new Error(`Action ${action.type} not implemented`);
    }

    return { action_id: actionId } as T;
  }

  async getActionStatus<T = ActionStatus>(actionId: string): Promise<T> {
    throw new Error("Not implemented");
  }

  async waitForAction(
    actionId: string,
    _options?: { timeoutMs?: number; maxWaitTimeMs?: number }
  ): Promise<ActionStatus> {
    const result = this.results.get(actionId);

    if (!result) {
      throw new Error(`Action ${actionId} not found`);
    }

    return result;
  }

  async migrateAndBindAction({
    bdbId,
    clusterIndex,
  }: {
    bdbId: string | number;
    clusterIndex: string | number;
  }): Promise<{ action_id: string }> {
    throw new Error("Not implemented");
  }

  /**
   * Simulates a Redis Enterprise hitless failover by sending SMIGRATING and SMIGRATED
   * push notifications to the client. The migrating slot range is calculated as 1/N of total
   * slots (where N = number of master nodes) to simulate removing one node from the cluster.
   *
   * @returns Promise resolving to ActionStatus on success
   * @throws Error if notification delivery fails
   */
  private async triggerFailover(): Promise<ActionStatus> {
    const nodes = await this.proxyController.getNodes();
    const nodeId = nodes.ids[0];
    const connections = await this.proxyController.getConnections();
    const connectionIds = connections[nodeId];

    // 1. Calculate migrating slot range and send SMIGRATING notification
    const slots = `0-${Math.floor(TOTAL_SLOTS / nodes.ids.length)}`;
    const seqId = Date.now().toString();
    const sMigratingNotification = Buffer.from(
      `>3\r\n+SMIGRATING\r\n:${seqId}\r\n+${slots}\r\n`
    ).toString("base64");

    const migratingResult = await this.proxyController.sendToClient(
      connectionIds[0],
      sMigratingNotification,
      "base64"
    );

    if (!migratingResult.success) {
      throw new Error(
        `[Proxy] Failed to send SMIGRATING notification: ${migratingResult.error}`
      );
    }

    // 2. Simulate maintenance delay
    await setTimeout(2_000);

    // 3. Calculate remaining nodes, build and send SMIGRATED notification
    const remainingNodes = nodes.ids.slice(1).map(parseNodeId);
    const sMigratedNotification =
      buildSMigratedNotification(remainingNodes).toString("base64");

    const migratedResult = await this.proxyController.sendToClient(
      connectionIds[0],
      sMigratedNotification,
      "base64"
    );

    if (!migratedResult.success) {
      throw new Error(
        `[Proxy] Failed to send SMIGRATED notification: ${migratedResult.error}`
      );
    }

    return {
      status: "success",
      error: null,
      output: "Failover completed!",
    };
  }
}

// TODO Check if we need this
// function buildClusterSlotsResponse(nodes: ProxyNode[]): Buffer {
//   if (nodes.length === 0) {
//     return Buffer.from("*0\r\n");
//   }

//   const totalSlots = 16384;
//   const slotLength = Math.floor(totalSlots / nodes.length);

//   let current = -1;
//   const mapping = nodes.map((node, i) => {
//     const from = current + 1;
//     const to = i === nodes.length - 1 ? 16383 : current + slotLength;
//     current = to;
//     const id = `proxy-id-${node.port}`;
//     return `*3\r\n:${from}\r\n:${to}\r\n*3\r\n$${node.host.length}\r\n${node.host}\r\n:${node.port}\r\n$${id.length}\r\n${id}\r\n`;
//   });

//   const response = `*${nodes.length}\r\n${mapping.join("")}`;
//   return Buffer.from(response);
// }

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

function buildSMigratedNotification(
  nodes: ProxyNode[],
  seqId: number = Date.now()
): Buffer {
  if (nodes.length === 0) {
    return Buffer.from(`>3\r\n+SMIGRATED\r\n:${seqId}\r\n*0\r\n`);
  }

  const slotLength = Math.floor(TOTAL_SLOTS / nodes.length);

  let current = -1;
  const nodeEntries = nodes.map((node, i) => {
    const from = current + 1;
    const to = i === nodes.length - 1 ? 16383 : current + slotLength;
    current = to;

    const hostPort = `${node.host}:${node.port}`;
    const slotRange = `${from}-${to}`;

    // *2\r\n+host:port\r\n+slot-range\r\n
    return `*2\r\n+${hostPort}\r\n+${slotRange}\r\n`;
  });

  // >3\r\n+SMIGRATED\r\n:{seqId}\r\n*{count}\r\n{entries}
  const response = `>3\r\n+SMIGRATED\r\n:${seqId}\r\n*${
    nodes.length
  }\r\n${nodeEntries.join("")}`;
  return Buffer.from(response);
}
