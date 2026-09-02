// Multi-database client with automatic failover between two Redis endpoints.
//
// Start two local servers first:
//   docker run -d --rm --name mdb-a -p 6401:6379 redis:8
//   docker run -d --rm --name mdb-b -p 6402:6379 redis:8
//
// Then run this script and try `docker pause mdb-a` — traffic fails over to
// the standby. `docker unpause mdb-a` brings the preferred member back:
// after its grace period it recovers and auto-fallback returns traffic to it.

import { createMultiDbClient } from 'redis';

const { client, controller } = createMultiDbClient({
  databases: [
    { id: 'primary', options: { socket: { host: '127.0.0.1', port: 6401 } }, weight: 1 },
    { id: 'standby', options: { socket: { host: '127.0.0.1', port: 6402 } }, weight: 0.5 }
  ],
  // aggressive settings so the demo reacts within a couple of seconds —
  // production deployments should stay closer to the defaults
  failureDetector: { minNumOfFailures: 2, failureRateThreshold: 50, windowSize: 2000 },
  healthCheck: { interval: 1000, timeout: 500, numProbes: 2, delayBetweenProbes: 100 },
  gracePeriod: 3000,
  autoFallbackInterval: 2000
});

controller.on('failover', (event) => console.log('failover:', event));
controller.on('fallback', (event) => console.log('fallback:', event));
controller.on('database-unhealthy', (event) => console.log('unhealthy:', event.id, `(${event.cause.message})`));
controller.on('database-recovered', (event) => console.log('recovered:', event.id));
controller.on('all-databases-down', (event) => console.log('all down, attempt', event.attempt, 'of', event.maxAttempts));
controller.on('error', () => {
  // background noise from failing members while they are down
});

await client.connect();
console.log('connected, active member:', controller.getActiveDatabase().id);

setInterval(async () => {
  try {
    console.log('counter =', await client.incr('counter'), 'via', controller.getActiveDatabase().id);
  } catch (err) {
    console.log('command failed:', err.message);
  }
}, 500);
