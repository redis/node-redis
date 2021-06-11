import { strict as assert } from 'assert';
import { TestRedisServers, itWithClient } from '../test-utils';
import { transformArguments } from './READONLY';

describe('READONLY', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['READONLY']
        );
    });
});
