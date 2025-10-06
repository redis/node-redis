import { setTimeout } from "node:timers/promises";

export type ActionType =
  | "dmc_restart"
  | "failover"
  | "reshard"
  | "sequence_of_actions"
  | "network_failure"
  | "execute_rlutil_command"
  | "execute_rladmin_command"
  | "migrate"
  | "bind"
  | "update_cluster_config";

export interface ActionRequest {
  type: ActionType;
  parameters?: {
    bdb_id?: string;
    [key: string]: unknown;
  };
}

export interface ActionStatus {
  status: string;
  error: unknown;
  output: string;
}

export class FaultInjectorClient {
  private baseUrl: string;
  #fetch: typeof fetch;

  constructor(baseUrl: string, fetchImpl: typeof fetch = fetch) {
    this.baseUrl = baseUrl.replace(/\/+$/, ""); // trim trailing slash
    this.#fetch = fetchImpl;
  }

  /**
   * Lists all available actions.
   * @throws {Error} When the HTTP request fails or response cannot be parsed as JSON
   */
  public listActions<T = unknown>(): Promise<T> {
    return this.#request<T>("GET", "/action");
  }

  /**
   * Triggers a specific action.
   * @param action The action request to trigger
   * @throws {Error} When the HTTP request fails or response cannot be parsed as JSON
   */
  public triggerAction<T extends { action_id: string }>(
    action: ActionRequest
  ): Promise<T> {
    return this.#request<T>("POST", "/action", action);
  }

  // public async printStatus() {
  //   const action = {
  //     type: 'execute_rladmin_command',
  //     parameters: {
  //       rladmin_command: "status",
  //       bdb_id: "1"
  //     }
  //   }
  //   const { action_id } = await this.#request<{action_id: string}>("POST", "/action", action);
  //   const status = await this.waitForAction(action_id);
  //   //@ts-ignore
  //   console.log(status.output.output);
  // }

  /**
   * Gets the status of a specific action.
   * @param actionId The ID of the action to check
   * @throws {Error} When the HTTP request fails or response cannot be parsed as JSON
   */
  public getActionStatus<T = ActionStatus>(actionId: string): Promise<T> {
    return this.#request<T>("GET", `/action/${actionId}`);
  }

  /**
   * Waits for an action to complete.
   * @param actionId The ID of the action to wait for
   * @param options Optional timeout and max wait time
   * @throws {Error} When the action does not complete within the max wait time
   */
  public async waitForAction(
    actionId: string,
    {
      timeoutMs,
      maxWaitTimeMs,
    }: {
      timeoutMs?: number;
      maxWaitTimeMs?: number;
    } = {}
  ): Promise<ActionStatus> {
    const timeout = timeoutMs || 1000;
    const maxWaitTime = maxWaitTimeMs || 60000;

    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      const action = await this.getActionStatus<ActionStatus>(actionId);

      if (action.status === "failed") {
        throw new Error(
          `Action id: ${actionId} failed! Error: ${action.error}`
        );
      }

      if (["finished", "success"].includes(action.status)) {
        return action;
      }

      await setTimeout(timeout);
    }

    throw new Error(`Timeout waiting for action ${actionId}`);
  }

  async migrateAndBindAction({
    bdbId,
    clusterIndex,
  }: {
    bdbId: string | number;
    clusterIndex: string | number;
  }) {
    const bdbIdStr = bdbId.toString();
    const clusterIndexStr = clusterIndex.toString();

    return this.triggerAction<{
      action_id: string;
    }>({
      type: "sequence_of_actions",
      parameters: {
        bdbId: bdbIdStr,
        actions: [
          {
            type: "migrate",
            params: {
              cluster_index: clusterIndexStr,
              bdb_id: bdbIdStr,
            },
          },
          {
            type: "bind",
            params: {
              cluster_index: clusterIndexStr,
              bdb_id: bdbIdStr,
            },
          },
        ],
      },
    });
  }

  async #request<T>(
    method: string,
    path: string,
    body?: Object | string
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    let payload: string | undefined;

    if (body) {
      if (typeof body === "string") {
        headers["Content-Type"] = "text/plain";
        payload = body;
      } else {
        headers["Content-Type"] = "application/json";
        payload = JSON.stringify(body);
      }
    }

    const response = await this.#fetch(url, { method, headers, body: payload });

    if (!response.ok) {
      try {
        const text = await response.text();
        throw new Error(`HTTP ${response.status} - ${text}`);
      } catch {
        throw new Error(`HTTP ${response.status}`);
      }
    }

    try {
      return (await response.json()) as T;
    } catch {
      throw new Error(
        `HTTP ${response.status} - Unable to parse response as JSON`
      );
    }
  }
}
