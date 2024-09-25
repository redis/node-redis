import { createClient } from 'redis';

const client = createClient({
    password: 'ZVFjxLEVF9meFVu54xzkKDqAae2hgU9K',
    socket: {
        host: 'redis-14113.c322.us-east-1-2.ec2.redns.redis-cloud.com',
        port: 14113
    }
});
