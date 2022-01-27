import TestUtils from '@node-redis/test-utils';
import RedisJSON from '.';

export default new TestUtils({
    dockerImageName: 'redislabs/rejson',
    dockerImageVersionArgument: 'rejson-version',
    defaultDockerVersion: '2.0.6'
});

export const GLOBAL = {
    SERVERS: {
        OPEN: {
            serverArguments: ['--loadmodule /usr/lib/redis/modules/rejson.so'],
            clientOptions: {
                modules: {
                    json: RedisJSON
                }
            }
        }
    }
};
