import { strict as assert } from 'assert';
import testUtils from '../test-utils';
import { transformArguments } from './CLUSTER_MYSHARDID';

describe('CLUSTER MYSHARDID', () => {
    testUtils.isVersionGreaterThanHook([7, 2]);

    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments(),
                ['CLUSTER', 'MYSHARDID']
            );
        });
    });
});
