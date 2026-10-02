/**
 * Compile-time regression tests for socket options types.
 *
 * Covers:
 *   - Heroku configuration pattern (issue #3113, #3023) where `tls` is a boolean expression
 *     and TLS options such as `rejectUnauthorized: false` are provided.
 *   - TCP connect options (noDelay, keepAlive, etc.) when `tls: true` or `tls: boolean`.
 *   - `rediss://` URLs with socket TLS options but without explicit `tls: true`.
 *   - IPC sockets with `path` (without requiring explicit `tls: false`).
 *   - Plain TCP socket configurations.
 */
import {
  createClient,
  type RedisClientType,
} from '../index';
import type {
  RedisSocketOptions,
  RedisTcpOptions,
  RedisTlsOptions,
  RedisIpcOptions,
  RedisTcpSocketOptions,
} from '../lib/client/socket';

// ---------------------------------------------------------------------------
// 1. Heroku pattern: boolean expression for tls + TLS options (issues #3113 & #3023)
// ---------------------------------------------------------------------------

const redis_url = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
export const herokuClient: RedisClientType = createClient({
  url: redis_url,
  socket: {
    tls: redis_url.match(/rediss:/) != null,
    rejectUnauthorized: false,
  },
});

// Dynamic boolean tls with servername and rejectUnauthorized
const isTls: boolean = Boolean(process.env.USE_TLS);
export const dynamicTlsClient = createClient({
  socket: {
    tls: isTls,
    rejectUnauthorized: false,
    servername: 'redis.example.com',
  },
});

// ---------------------------------------------------------------------------
// 2. TLS options + TCP connect options compatibility
// ---------------------------------------------------------------------------

export const tlsWithTcpOptsClient = createClient({
  socket: {
    tls: true,
    rejectUnauthorized: false,
    noDelay: true,
    keepAlive: true,
    keepAliveInitialDelay: 5000,
    port: 6380,
    host: 'redis.example.com',
  },
});

// ---------------------------------------------------------------------------
// 3. Secure URL (rediss://) with TLS socket options but omitted tls property
// ---------------------------------------------------------------------------

export const secureUrlWithTlsOptsClient = createClient({
  url: 'rediss://user:secret@localhost:6379',
  socket: {
    rejectUnauthorized: false,
  },
});

// ---------------------------------------------------------------------------
// 4. IPC (Unix domain socket) options
// ---------------------------------------------------------------------------

export const ipcClientWithoutTls = createClient({
  socket: {
    path: '/var/run/redis.sock',
  },
});

export const ipcClientWithExplicitFalseTls = createClient({
  socket: {
    path: '/var/run/redis.sock',
    tls: false,
  },
});

// ---------------------------------------------------------------------------
// 5. Plain TCP socket options
// ---------------------------------------------------------------------------

export const tcpClient = createClient({
  socket: {
    port: 6379,
    host: '127.0.0.1',
    tls: false,
    noDelay: true,
  },
});

// ---------------------------------------------------------------------------
// 6. Direct type assignments
// ---------------------------------------------------------------------------

export const socketOptionsHeroku: RedisSocketOptions = {
  tls: redis_url.match(/rediss:/) != null,
  rejectUnauthorized: false,
};

export const tcpSocketOptions: RedisTcpSocketOptions = {
  tls: isTls,
  rejectUnauthorized: false,
  port: 6379,
};

export const tlsOptions: RedisTlsOptions = {
  tls: true,
  rejectUnauthorized: false,
  noDelay: true,
};

export const tcpOptions: RedisTcpOptions = {
  port: 6379,
  tls: false,
};

export const ipcOptions: RedisIpcOptions = {
  path: '/tmp/redis.sock',
};
