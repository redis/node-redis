// Check the connection status of the Redis client instance.
import { createClient } from 'redis';

const client = createClient();

console.log('Before client.connect()...');

// isOpen will return False here as the client's socket is not open yet.
// isReady will return False here, client is not yet ready to use.
console.log(`client.isOpen: ${client.isOpen}, client.isReady: ${client.isReady}`);

// Begin connection process...
const connectPromise = client.connect();

console.log('After client.connect()...');

// isOpen will return True here as the client's socket is open now.
// isReady will return False here as the promise hasn't resolved yet.
console.log(`client.isOpen: ${client.isOpen}, client.isReady: ${client.isReady}`);

await connectPromise;
console.log('Afer connectPromise has resolved...');

// isOpen will return True here as the client's socket is open now.
// isReady will return True here, client is ready to use.
console.log(`client.isOpen: ${client.isOpen}, client.isReady: ${client.isReady}`);

await client.quit();
