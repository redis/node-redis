// A sample subscriber showing how the subscribe method and pSubscribe method work.
// https://redis.io/commands/subscribe/
// https://redis.io/commands/pSubscribe/
// This consumes messages published by pubsub-publisher.js

import { createClient} from 'redis';

// Create and connect client before executing any Redis commands.
const client = createClient();
await client.connect();

// Each subscriber needs to connect individually therefore we duplicate the client.
const channel1Sub = client.duplicate();
const channel2Sub = client.duplicate();
const noChannelsSub = client.duplicate();
const allChannelsSub = client.duplicate();

await channel1Sub.connect();
await channel2Sub.connect();
await noChannelsSub.connect();
await allChannelsSub.connect();

// This subscriber only will receive messages from channel 1 as they are using the subscribe method and subscribed to chan1nel.
await channel1Sub.subscribe('chan1nel', (message) => {
  console.log(`Channel1 subscriber collected message: ${message}`);
},true);

// This subscriber only will receive messages from channel 2 as they are using the subscribe method and subscribed to chan2nel.
await channel2Sub.subscribe('chan2nel', (message) => {
  console.log(`Channel2 subscriber collected message: ${message}`);
},true);

// This subscriber will not receive any messages as its channel does not exist.
await noChannelsSub.subscribe('chan*nel', (message) => {
  console.log(`This message will never be seen as we are not using pSubscribe here. ${message}`);
},true);

// This subscriber receive messages from both channel 1 and channel 2 using the pSubscribe method.
await allChannelsSub.pSubscribe('chan*nel', (message, channel) => {
  console.log(`Channel ${channel} sent message: ${message}`);
},true);