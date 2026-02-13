export type ProxyStats = {
  totalConnections: number;
  activeConnections: number;
  totalBytesReceived: number;
  totalBytesSent: number;
  totalCommandsReceived: number;
  totalCommandsSent: number;
};

export type SendResult = {
  success: boolean;
  connectionId: string;
  error?: string;
};

export type ProxyConfig = {
  listenPort: number;
  listenHost?: string;
  targetHost: string;
  targetPort: number;
  timeout?: number;
  enableLogging?: boolean;
};

export default class ProxyController {
  constructor(private url: string) { }

  private fetchJson(path: string, options?: RequestInit): Promise<unknown> {
    return fetch(`${this.url}${path}`, options).then(res => res.json());
  }

  getStats(): Promise<Record<string, ProxyStats>> {
    return this.fetchJson('/stats') as Promise<Record<string, ProxyStats>>;
  }

  getConnections(): Promise<Record<string, readonly string[]>> {
    return this.fetchJson('/connections') as Promise<Record<string, readonly string[]>>;
  }

  getNodes(): Promise<{ ids: string[] }> {
    return this.fetchJson('/nodes') as Promise<{ ids: string[] }>;
  }

  createNode(config: Partial<ProxyConfig>): Promise<{ success: boolean; cfg: ProxyConfig }> {
    return this.fetchJson('/nodes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    }) as Promise<{ success: boolean; cfg: ProxyConfig }>;
  }

  deleteNode(nodeId: string): Promise<{ success: boolean }> {
    return this.fetchJson(`/nodes/${nodeId}`, {
      method: 'DELETE'
    }) as Promise<{ success: boolean }>;
  }

  sendToClient(connectionId: string, data: string, encoding: 'base64' | 'raw' = 'base64'): Promise<SendResult> {
    return this.fetchJson(`/send-to-client/${connectionId}?encoding=${encoding}`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: data
    }) as Promise<SendResult>;
  }

  sendToClients(connectionIds: string[], data: string, encoding: 'base64' | 'raw' = 'base64'): Promise<{ results: SendResult[] }> {
    return this.fetchJson(`/send-to-clients?connectionIds=${connectionIds.join(',')}&encoding=${encoding}`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: data
    }) as Promise<{ results: SendResult[] }>;
  }

  sendToAllClients(data: string, encoding: 'base64' | 'raw' = 'base64'): Promise<{ results: SendResult[] }> {
    return this.fetchJson(`/send-to-all-clients?encoding=${encoding}`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: data
    }) as Promise<{ results: SendResult[] }>;
  }

  closeConnection(connectionId: string): Promise<{ success: boolean; connectionId: string }> {
    return this.fetchJson(`/connections/${connectionId}`, {
      method: 'DELETE'
    }) as Promise<{ success: boolean; connectionId: string }>;
  }

  createScenario(responses: string[], encoding: 'base64' | 'raw' = 'base64'): Promise<{ success: boolean; totalResponses: number }> {
    return this.fetchJson('/scenarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ responses, encoding })
    }) as Promise<{ success: boolean; totalResponses: number }>;
  }

  addInterceptor(name: string, match: string, response: string, encoding: 'base64' | 'raw' = 'base64'): Promise<{ success: boolean; name: string }> {
    return this.fetchJson('/interceptors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, match, response, encoding })
    }) as Promise<{ success: boolean; name: string }>;
  }
}
