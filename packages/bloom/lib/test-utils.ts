import TestUtils from '@redis/test-utils';
import RedisBloomModules from '.';

export default new TestUtils({
    dockerImageName: 'redislabs/rebloom',
    dockerImageVersionArgument: 'redisbloom-version',
    defaultDockerVersion: 'edge'
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
