import * as net from 'net';
import { EventEmitter } from 'events';

interface ProxyConfig {
  readonly listenPort: number;
  readonly listenHost?: string;
  readonly targetHost: string;
  readonly targetPort: number;
  readonly timeout?: number;
  readonly enableLogging?: boolean;
}

interface ConnectionInfo {
  readonly id: string;
  readonly clientAddress: string;
  readonly clientPort: number;
  readonly connectedAt: Date;
}

interface ActiveConnection extends ConnectionInfo {
  readonly clientSocket: net.Socket;
  readonly serverSocket: net.Socket;
}

type SendResult =
  | { readonly success: true; readonly connectionId: string }
  | { readonly success: false; readonly error: string; readonly connectionId: string };

type DataDirection = 'client->server' | 'server->client';

interface ProxyStats {
  readonly activeConnections: number;
  readonly totalConnections: number;
  readonly connections: readonly ConnectionInfo[];
}

interface ProxyEvents {
  /** Emitted when a new client connects */
  'connection': (connectionInfo: ConnectionInfo) => void;
  /** Emitted when a connection is closed */
  'disconnect': (connectionInfo: ConnectionInfo) => void;
  /** Emitted when data is transferred */
  'data': (connectionId: string, direction: DataDirection, data: Buffer) => void;
  /** Emitted when an error occurs */
  'error': (error: Error, connectionId?: string) => void;
  /** Emitted when the proxy server starts */
  'listening': (host: string, port: number) => void;
  /** Emitted when the proxy server stops */
  'close': () => void;
}

export class RedisProxy extends EventEmitter {
  private readonly server: net.Server;
  public readonly config: Required<ProxyConfig>;
  private readonly connections: Map<string, ActiveConnection>;
  private isRunning: boolean;

  constructor(config: ProxyConfig) {
    super();


    this.config = {
      listenHost: '127.0.0.1',
      timeout: 30000,
      enableLogging: false,
      ...config
    };

    this.connections = new Map();
    this.isRunning = false;
    this.server = this.createServer();
  }

  public async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isRunning) {
        reject(new Error('Proxy is already running'));
        return;
      }

      this.server.listen(this.config.listenPort, this.config.listenHost, () => {
        this.isRunning = true;
        this.log(`Proxy listening on ${this.config.listenHost}:${this.config.listenPort}`);
        this.log(`Forwarding to Redis server at ${this.config.targetHost}:${this.config.targetPort}`);
        this.emit('listening', this.config.listenHost, this.config.listenPort);
        resolve();
      });

      this.server.on('error', (error) => {
        this.emit('error', error);
        reject(error);
      });
    });
  }

  public async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.isRunning) {
        resolve();
        return;
      }

      Array.from(this.connections.keys()).forEach((connectionId) => {
        this.closeConnection(connectionId);
      });

      this.server.close(() => {
        this.isRunning = false;
        this.log('Proxy server stopped');
        this.emit('close');
        resolve();
      });
    });
  }

  public getStats(): ProxyStats {
    const connections = Array.from(this.connections.values());

    return {
      activeConnections: connections.length,
      totalConnections: connections.length,
      connections: connections.map((conn) => ({
        id: conn.id,
        clientAddress: conn.clientAddress,
        clientPort: conn.clientPort,
        connectedAt: conn.connectedAt,
      }))
    };
  }

  public closeConnection(connectionId: string): boolean {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return false;
    }

    connection.clientSocket.destroy();
    connection.serverSocket.destroy();
    this.connections.delete(connectionId);
    this.emit('disconnect', connection);
    return true;
  }

  public sendToClient(connectionId: string, data: Buffer): SendResult {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return {
        success: false,
        error: 'Connection not found',
        connectionId
      };
    }

    if (connection.clientSocket.destroyed || !connection.clientSocket.writable) {
      return {
        success: false,
        error: 'Client socket is not writable',
        connectionId
      };
    }

    try {
      connection.clientSocket.write(data);

      this.log(`Sent ${data.length} bytes to client ${connectionId}`);
      this.emit('data', connectionId, 'server->client', data);

      return {
        success: true,
        connectionId
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.log(`Failed to send data to client ${connectionId}: ${errorMessage}`);
      return {
        success: false,
        error: errorMessage,
        connectionId
      };
    }
  }

  public sendToAllClients(data: Buffer): readonly SendResult[] {
    const connectionIds = Array.from(this.connections.keys());
    const results = connectionIds.map((connectionId) =>
      this.sendToClient(connectionId, data)
    );

    const successCount = results.filter((result) => result.success).length;
    const totalCount = results.length;

    this.log(`Sent ${data.length} bytes to ${successCount}/${totalCount} clients`);

    return results;
  }

  public sendToClients(connectionIds: readonly string[], data: Buffer): readonly SendResult[] {
    const results = connectionIds.map((connectionId) =>
      this.sendToClient(connectionId, data)
    );

    const successCount = results.filter((result) => result.success).length;
    const totalCount = results.length;

    this.log(`Sent ${data.length} bytes to ${successCount}/${totalCount} specified clients`);

    return results;
  }

  public getActiveConnectionIds(): readonly string[] {
    return Array.from(this.connections.keys());
  }

  private createServer(): net.Server {
    return net.createServer((clientSocket) => {
      this.handleClientConnection(clientSocket);
    });
  }

  private handleClientConnection(clientSocket: net.Socket): void {
    const connectionId = this.generateConnectionId();
    const serverSocket = net.createConnection({
      host: this.config.targetHost,
      port: this.config.targetPort
    });

    const connectionInfo: ActiveConnection = {
      id: connectionId,
      clientAddress: clientSocket.remoteAddress || 'unknown',
      clientPort: clientSocket.remotePort || 0,
      connectedAt: new Date(),
      clientSocket,
      serverSocket
    };

    this.connections.set(connectionId, connectionInfo);
    this.log(`New connection ${connectionId} from ${connectionInfo.clientAddress}:${connectionInfo.clientPort}`);

    clientSocket.setTimeout(this.config.timeout);

    serverSocket.on('connect', () => {
      this.log(`Connected to Redis server for connection ${connectionId}`);
      this.emit('connection', connectionInfo);
    });

    clientSocket.on('data', (data) => {
      this.emit('data', connectionId, 'client->server', data);
      serverSocket.write(data);
    });

    serverSocket.on('data', (data) => {
      this.emit('data', connectionId, 'server->client', data);
      clientSocket.write(data);
    });

    clientSocket.on('close', () => {
      this.log(`Client disconnected for connection ${connectionId}`);
      serverSocket.destroy();
      this.cleanupConnection(connectionId);
    });

    serverSocket.on('close', () => {
      this.log(`Server disconnected for connection ${connectionId}`);
      clientSocket.destroy();
      this.cleanupConnection(connectionId);
    });

    clientSocket.on('error', (error) => {
      this.log(`Client error for connection ${connectionId}: ${error.message}`);
      this.emit('error', error, connectionId);
      serverSocket.destroy();
      this.cleanupConnection(connectionId);
    });

    serverSocket.on('error', (error) => {
      this.log(`Server error for connection ${connectionId}: ${error.message}`);
      this.emit('error', error, connectionId);
      clientSocket.destroy();
      this.cleanupConnection(connectionId);
    });

    clientSocket.on('timeout', () => {
      this.log(`Connection ${connectionId} timed out`);
      clientSocket.destroy();
      serverSocket.destroy();
      this.cleanupConnection(connectionId);
    });
  }

  private cleanupConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      this.connections.delete(connectionId);
      this.emit('disconnect', connection);
    }
  }

  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private log(message: string): void {
    if (this.config.enableLogging) {
      console.log(`[RedisProxy] ${new Date().toISOString()} - ${message}`);
    }
  }
}
import { createServer } from 'net';

export function getFreePortNumber(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();

    server.listen(0, () => {
      const address = server.address();
      server.close(() => {
        if (address && typeof address === 'object') {
          resolve(address.port);
        }
      });
    });

    server.on('error', reject);
  });
}

export { RedisProxy as RedisTransparentProxy };
export type { ProxyConfig, ConnectionInfo, ProxyEvents, SendResult, DataDirection, ProxyStats };

