import { strict as assert } from 'assert';
import testUtils from '../test-utils';
import { transformArguments } from './FUNCTION_KILL';

describe('FUNCTION KILL', () => {
    testUtils.isVersionGreaterThanHook([7]);

    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['FUNCTION', 'KILL']
        );
    });
});
