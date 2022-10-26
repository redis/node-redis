// Connect to Redis 6.x as an ACL user.  Attempt to run a command
// that the user is allowed to execute, and a command that the 
// user is not allowed to execute.

// Create the test user in redis-cli with this command:
//   acl setuser testuser on >testpassword +ping

import { createClient } from 'redis';

const client = createClient({
  url: 'redis://testuser:testpassword@127.0.0.1:6379'
});

await client.connect();

// Returns PONG
console.log(`Response from PING command: ${await client.ping()}`);

try {
  // This will error as this user is not allowed to run this command...
  console.log(`Response from GET command: ${await client.get('somekey')}`);
} catch (e) {
  console.log(`GET command failed: ${e.message}`);
}

await client.quit();
