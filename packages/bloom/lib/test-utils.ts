import TestUtils from '@node-redis/test-utils';
import RedisBloomModules from '.';

export default new TestUtils({
    dockerImageName: 'redislabs/rebloom',
    dockerImageVersionArgument: 'redisbloom-version',
    defaultDockerVersion: '2.2.9'
});

export const GLOBAL = {
    SERVERS: {
        OPEN: {
            serverArguments: ['--loadmodule /usr/lib/redis/modules/redisbloom.so'],
            clientOptions: {
                modules: RedisBloomModules
            }
        }
    }
};
