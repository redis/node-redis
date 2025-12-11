import { setTimeout } from "node:timers/promises";

import {
  ActionRequest,
  ActionStatus,
  CreateDatabaseConfig,
  IFaultInjectorClient,
} from "./types";

export class FaultInjectorClient implements IFaultInjectorClient {
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
  public async triggerAction<T extends { action_id: string }>(
    action: ActionRequest,
    options?: {
      timeoutMs?: number;
      maxWaitTimeMs?: number;
    }
  ): Promise<ActionStatus> {
    const { action_id } = await this.#request<T>("POST", "/action", action);

    return this.waitForAction(action_id, options);
  }

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

  /**
   * Deletes a database.
   * @param clusterIndex The index of the cluster
   * @param bdbId The database ID
   * @throws {Error} When the HTTP request fails or response cannot be parsed as JSON
   */
  public async deleteDatabase(
    bdbId: number | string,
    clusterIndex: number = 0
  ) {
    return this.triggerAction({
      type: "delete_database",
      parameters: {
        cluster_index: clusterIndex,
        bdb_id: bdbId.toString(),
      },
    });
  }

  /**
   * Deletes all databases.
   * @param clusterIndex The index of the cluster
   * @throws {Error} When the HTTP request fails or response cannot be parsed as JSON
   */
  public async deleteAllDatabases(clusterIndex: number = 0) {
    return this.triggerAction({
      type: "delete_database",
      parameters: {
        cluster_index: clusterIndex,
        delete_all: true,
      },
    });
  }

  /**
   * Creates a new database.
   * @param clusterIndex The index of the cluster
   * @param databaseConfig The database configuration
   * @throws {Error} When the HTTP request fails or response cannot be parsed as JSON
   */
  public async createDatabase(
    databaseConfig: CreateDatabaseConfig,
    clusterIndex: number = 0
  ) {
    const action = await this.triggerAction({
      type: "create_database",
      parameters: {
        cluster_index: clusterIndex,
        database_config: databaseConfig,
      },
    });

    const dbConfig =
      typeof action.output === "object"
        ? action.output
        : JSON.parse(action.output);

    const rawEndpoints = dbConfig.raw_endpoints[0];

    if (!rawEndpoints) {
      throw new Error("No endpoints found in database config");
    }

    return {
      host: rawEndpoints.dns_name,
      port: rawEndpoints.port,
      password: dbConfig.password,
      username: dbConfig.username,
      tls: dbConfig.tls,
      bdbId: dbConfig.bdb_id,
    };
  }
}
