import { setTimeout } from "node:timers/promises";

import {
  ActionRequest,
  ActionStatus,
  ActionTrigger,
  ListActionTriggersResponse,
  CreateDatabaseConfig,
  DatabaseConfig,
  IFaultInjectorClient,
} from "./types";

export class FaultInjectorClient implements IFaultInjectorClient {
  private baseUrl: string;
  private dbConfig?: DatabaseConfig
  #fetch: typeof fetch;

  constructor(baseUrl: string, fetchImpl: typeof fetch = fetch) {
    this.baseUrl = baseUrl.replace(/\/+$/, ""); // trim trailing slash
    console.log('[FI] Constructor:', this.baseUrl);
    this.#fetch = fetchImpl;
  }

  async listActionTriggers(actionName: string, effect: string): Promise<ActionTrigger[]> {
    const res = await this.#request<ListActionTriggersResponse>("GET", `/${actionName}?effect=${effect}`);
    console.log({
      ...res,
      triggers: res.triggers.map(trigger => ({
        ...trigger,
        requirements: JSON.stringify(trigger.requirements)
      }))
    });
    return res.triggers;
  }

  selectDbConfig(dbConfig: DatabaseConfig) {
    this.dbConfig = dbConfig;
  }

  /**
   * Lists all available actions.
   * @throws {Error} When the HTTP request fails or response cannot be parsed as JSON
   */
  public listActions<T = unknown>(): Promise<T> {
    console.log('[FI] listActions');
    return this.#request<T>("GET", "/action");
  }

  /**
   * Triggers a specific action.
   * @param action The action request to trigger
   * @throws {Error} When the HTTP request fails or response cannot be parsed as JSON
   */
  public async triggerAction<T extends { action_id: string }>(
    action: Readonly<ActionRequest>,
    options?: {
      timeoutMs?: number;
      maxWaitTimeMs?: number;
    }
  ): Promise<ActionStatus> {
    // Create a deep copy to avoid mutating the original action object
    const actionCopy: ActionRequest = JSON.parse(JSON.stringify(action));

    if (actionCopy.parameters !== undefined && actionCopy.parameters.bdb_id === undefined) {
      const resolvedBdbId = this.#resolveBdbId();
      if (resolvedBdbId !== undefined) {
        console.log('[FI] bdb_id was not provided. setting selected bdb_id');
        actionCopy.parameters.bdb_id = String(resolvedBdbId);
      }
    }
    const params = actionCopy.parameters ? JSON.stringify(actionCopy.parameters) : '';
    console.log('[FI] triggerAction:', actionCopy.type, params);
    const { action_id } = await this.#request<T>("POST", "/action", actionCopy);
    console.log('[FI] action_id:', action_id);

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
    console.log('[FI] waitForAction:', actionId, `(poll: ${timeout}ms, max: ${maxWaitTime}ms)`);

    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      const action = await this.getActionStatus<ActionStatus>(actionId);

      if (action.status === "failed") {
        console.error('[FI] FAILED:', action.error);
        throw new Error(
          `Action id: ${actionId} failed! Error: ${action.error}`
        );
      }

      if (["finished", "success"].includes(action.status)) {
        console.log('[FI] ✓ completed');
        return action;
      }

      await setTimeout(timeout);
    }

    console.error('[FI] TIMEOUT after', maxWaitTime, 'ms');
    throw new Error(`Timeout waiting for action ${actionId}`);
  }

  async migrateAndBindAction({
    bdbId,
    clusterIndex,
  }: {
    bdbId?: string | number;
    clusterIndex: string | number;
  }) {
    const resolvedBdbId = this.#resolveBdbId(bdbId);
    console.log('[FI] migrateAndBind: bdb', resolvedBdbId, 'cluster', clusterIndex);
    const clusterIndexStr = clusterIndex.toString();

    return this.triggerAction<{
      action_id: string;
    }>({
      type: "sequence_of_actions",
      parameters: {
        bdbId: resolvedBdbId,
        actions: [
          {
            type: "migrate",
            params: {
              cluster_index: clusterIndexStr,
              bdb_id: resolvedBdbId,
            },
          },
          {
            type: "bind",
            params: {
              cluster_index: clusterIndexStr,
              bdb_id: resolvedBdbId,
            },
          },
        ],
      },
    });
  }

  #resolveBdbId(bdbId?: string | number): string | undefined {
    if (bdbId !== undefined) {
      if (this.dbConfig?.bdbId !== undefined) {
        console.warn(`[FI] User provided bdbId(${bdbId}), which will shadow selected bdbId(${this.dbConfig.bdbId})`);
      }
      return String(bdbId);
    }

    if (this.dbConfig?.bdbId !== undefined) {
      return String(this.dbConfig.bdbId);
    }

  }

  async #request<T>(
    method: string,
    path: string,
    body?: Object | string
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    console.log('[FI]', method, path);
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
        console.error('[FI] HTTP', response.status, '-', text);
        throw new Error(`HTTP ${response.status} - ${text}`);
      } catch {
        console.error('[FI] HTTP', response.status);
        throw new Error(`HTTP ${response.status}`);
      }
    }

    try {
      const result = (await response.json()) as T;
      return result;
    } catch {
      console.error('[FI] Failed to parse JSON response');
      throw new Error(
        `HTTP ${response.status} - Unable to parse response as JSON`
      );
    }
  }

  /**
   * Deletes a database.
   * @param clusterIndex The index of the cluster
   * @param bdbId The database ID (optional if dbConfig is set)
   * @throws {Error} When the HTTP request fails or response cannot be parsed as JSON
   */
  public async deleteDatabase(
    bdbId?: number | string,
    clusterIndex: number = 0
  ) {
    const resolvedBdbId = this.#resolveBdbId(bdbId);
    console.log('[FI] deleteDatabase: bdb', resolvedBdbId, 'cluster', clusterIndex);
    return this.triggerAction({
      type: "delete_database",
      parameters: {
        cluster_index: clusterIndex,
        bdb_id: resolvedBdbId,
      },
    });
  }

  /**
   * Deletes all databases.
   * @param clusterIndex The index of the cluster
   * @throws {Error} When the HTTP request fails or response cannot be parsed as JSON
   */
  public async deleteAllDatabases(clusterIndex: number = 0) {
    console.log('[FI] deleteAllDatabases: cluster', clusterIndex);
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
  public async createAndSelectDatabase(
    databaseConfig: CreateDatabaseConfig,
    clusterIndex: number = 0
  ) {
    console.log('[FI] createDatabase: cluster', clusterIndex);
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
      console.error('[FI] No endpoints found');
      throw new Error("No endpoints found in database config");
    }

    const result = {
      host: rawEndpoints.dns_name,
      port: rawEndpoints.port,
      password: dbConfig.password,
      username: dbConfig.username,
      tls: dbConfig.tls,
      bdbId: dbConfig.bdb_id,
    };
    console.log('[FI] created:', result.host + ':' + result.port, 'bdb', result.bdbId);
    this.selectDbConfig(result);

    return result;
  }

}
