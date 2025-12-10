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

export interface IFaultInjectorClient {
  triggerAction<T extends { action_id: string }>(
    action: ActionRequest
  ): Promise<T>;

  getActionStatus<T = ActionStatus>(actionId: string): Promise<T>;

  waitForAction(
    actionId: string,
    options?: {
      timeoutMs?: number;
      maxWaitTimeMs?: number;
    }
  ): Promise<ActionStatus>;

  migrateAndBindAction({
    bdbId,
    clusterIndex,
  }: {
    bdbId: string | number;
    clusterIndex: string | number;
  }): Promise<{ action_id: string }>;
}
