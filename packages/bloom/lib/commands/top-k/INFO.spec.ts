import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../../test-utils';
import { transformArguments } from './INFO';

describe('TOPK INFO', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('test'),
            ['TOPK.INFO', 'test']
        );
    });

    testUtils.testWithClient('client.topk.info', async client => {
        await client.topk.reserve('A', 5);

        assert.deepEqual(
            await client.topk.info('A'),
            {
                k: 5,
                width: 8,
                depth: 7,
                decay: '0.90000000000000002'
            }
        );

    }, GLOBAL.SERVERS.OPEN);
});
