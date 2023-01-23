import TestUtils from '@redis/test-utils';
import RediSearch from '.';

export default new TestUtils({
    dockerImageName: 'redislabs/redisearch',
    dockerImageVersionArgument: 'redisearch-version',
    defaultDockerVersion: '2.4.9'
});

export const GLOBAL = {
    SERVERS: {
        OPEN: {
            serverArguments: ['--loadmodule /usr/lib/redis/modules/redisearch.so'],
            clientOptions: {
                modules: {
                    ft: RediSearch
                }
            }
        }
    }
};
