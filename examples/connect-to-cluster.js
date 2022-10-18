//This is an example script to connect to a running cluster.
// After connecting to the cluster I am attempting to set and get a value.

//To setup this cluster you can follow the guide here : 
// https://redis.io/docs/manual/scaling/
// In this guide the ports which are being used are 7000 - 7005 
//But since I am a macOS user I am using 7001 - 7006


import { createCluster } from 'redis';

const cluster = createCluster({
    rootNodes : [
        {
            url : 'redis://127.0.0.1:7001'
        },
        {
            url : 'redis://127.0.0.1:7002'
        },
        {
            url : 'redis://127.0.0.1:7003'
        }
    ]
});

cluster.on('error', (err) => console.log('Redis Client Error', err));

await cluster.connect();

await cluster.set('foo', 'bar');
const value = await cluster.get('foo')
console.log(value)
