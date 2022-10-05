// A sample publisher using the publish function to put message on different channels.
// https://redis.io/commands/publish/
import { createClient } from 'redis';

const client = createClient();

await client.connect();

for (let i = 0; i < 10000; i++) {
  //1st channel created to publish 10000 messages
  await client.publish('chan1nel', `channel1_message_${i}`);
  //2nd channel created to publish 10000 messages
  await client.publish('chan2nel', `channel2_message_${i}`);
}
await client.quit();
