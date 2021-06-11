import assert from 'assert/strict';
import RedisClient, { RedisClientType } from './client';
import { RedisModules } from './commands';
import { RedisLuaScripts } from './lua-script';
import { spawn } from 'child_process';
import { once } from 'events';
import tcpPortUsed from 'tcp-port-used';
import { RedisSocketOptions } from './socket';
import which from 'which';

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

export function itWithClient(type: TestRedisServers, title: string, fn: (client: RedisClientType<RedisModules, RedisLuaScripts>) => Promise<void>) {
    it(title, async () => {
        const client = RedisClient.create({
            socket: TEST_REDIS_SERVERS[type]
        });
        
        await client.connect();

        try {
            await client.flushAll();
            await fn(client);
        } finally {
            await client.flushAll();
            await client.disconnect();
        }
    });
}

const REDIS_PATH = which.sync('redis-server');

let port = 6379;

async function spawnRedisServer(args?: Array<string>): Promise<number> {
    const currentPort = port++,
        process = spawn(REDIS_PATH, [
            '--save',
            '',
            '--port',
            currentPort.toString(),
            ...(args ?? [])
        ]);

    // TODO: catch process exit

    await tcpPortUsed.waitForStatus(currentPort, '127.0.0.1', true, 10, 1000);

    after(() => {
        assert.ok(process.kill());
        return once(process, 'close');
    });

    return currentPort;
}

