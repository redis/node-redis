import RedisClient, { RedisClientOptions, RedisClientType } from './client.js';
import { RedisModules } from './commands/index.js';
import { spawn } from 'child_process';
import { once } from 'events';
import tcpPortUsed from 'tcp-port-used';
import { RedisSocketOptions } from './socket.js';

export enum TestRedisServers {
    OPEN,
    PASSWORD
}

export const TEST_REDIS_SERVERS: Partial<Record<TestRedisServers, RedisSocketOptions>> = {};

before(() => {
    return Promise.all([
        spawnOpenServer(),
        spawnPasswordServer()
    ]);
});

async function spawnOpenServer(): Promise<void> {
    TEST_REDIS_SERVERS[TestRedisServers.OPEN] = {
        port: await spawnRedisServer()
    };
}

async function spawnPasswordServer(): Promise<void> {
    TEST_REDIS_SERVERS[TestRedisServers.PASSWORD] = {
        port: await spawnRedisServer(['--requirepass', 'password']),
        username: 'default',
        password: 'password'
    };
}

export function itWithClient(type: TestRedisServers, title: string, fn: (client: RedisClientType<RedisModules>) => Promise<void>) {
    it(title, async () => {
        const client = RedisClient.create({
            socket: TEST_REDIS_SERVERS[type]
        });
        await client.connect();

        try {
            await fn(client);
        } finally {
            await client.flushAll();
            await client.disconnect();
        }
    });
}

let port = 6379;

async function spawnRedisServer(args?: Array<string>): Promise<number> {
    const currentPort = port++,
        process = spawn('redis-server', [
            '--save',
            '',
            '--port',
            currentPort.toString(),
            ...(args ?? [])
        ]);

    // TODO: catch process exit

    await tcpPortUsed.waitForStatus(currentPort, '127.0.0.1', true, 10, 1000);

    after(() => {
        process.kill();
        return once(process, 'close');
    });

    return currentPort;
}

