// A sample publisher using the publish function to put message on different channels.
// https://redis.io/commands/publish/
import { createClient } from 'redis';

const client = createClient();

await client.connect();

// Declare constant variables for the name of the clients we will publish to as they will be required for logging.
const channel1 = 'chan1nel';
const channel2 = 'chan2nel';

for (let i = 0; i < 10000; i++) {
  // 1st channel created to publish 10000 messages.
  await client.publish(channel1, `channel1_message_${i}`);
  console.log(`publishing message on ${channel1}`);
  // 2nd channel created to publish 10000 messages.
  await client.publish(channel2, `channel2_message_${i}`);
  console.log(`publishing message on ${channel2}`);
}
