// Opens a Node REPL with a connected `client` in scope.
// Uses the built packages, so run `npm run build` after source changes.
// Target another server with `npm run repl -- --host <host> --port <port>`
// (either flag alone is fine) or with REDIS_URL. Flags win over REDIS_URL.
import repl from 'node:repl';
import { parseArgs } from 'node:util';
import { createClient } from 'redis';

const { values: { host, port } } = parseArgs({
  options: {
    host: { type: 'string', short: 'h' },
    port: { type: 'string', short: 'p' }
  }
});

const url = host || port
  ? `redis://${host ?? 'localhost'}:${port ?? 6379}`
  : process.env.REDIS_URL ?? 'redis://localhost:6379';
const client = createClient({ url });
// Connection errors such as ECONNREFUSED carry the reason in `code`, not `message`.
const reason = err => err.code ?? err.message;

// Exit if the first connect fails; after that, keep the default reconnects.
const onConnectError = err => {
  console.error(`Could not connect to ${url}: ${reason(err)}`);
  process.exit(1);
};
client.once('error', onConnectError);
await client.connect();
client.off('error', onConnectError);
client.on('error', err => console.error('Redis client error:', reason(err)));
console.log(`Connected to ${url}. Use \`client\`, e.g. await client.ping()`);

const server = repl.start('redis> ');
server.context.client = client;
server.on('exit', async () => {
  await client.close();
  process.exit();
});
