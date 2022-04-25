import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments, transformReply } from './BZPOPMAX';
import { commandOptions } from '../../index';

describe('BZPOPMAX', () => {
    describe('transformArguments', () => {
        it('single', () => {
            assert.deepEqual(
                transformArguments('key', 0),
                ['BZPOPMAX', 'key', '0']
            );
        });

        it('multiple', () => {
            assert.deepEqual(
                transformArguments(['1', '2'], 0),
                ['BZPOPMAX', '1', '2', '0']
            );
        });
    });

    describe('transformReply', () => {
        it('null', () => {
            assert.equal(
                transformReply(null),
                null
            );
        });

        it('member', () => {
            assert.deepEqual(
                transformReply(['key', 'value', '1']),
                {
                    key: 'key',
                    value: 'value',
                    score: 1
                }
            );
        });
    });

    testUtils.testWithClient('client.bzPopMax', async client => {
        const [ bzPopMaxReply ] = await Promise.all([
            client.bzPopMax(
                commandOptions({ isolated: true }),
                'key',
                1
            ),
            client.zAdd('key', [{
                value: '1',
                score: 1
            }])
        ]);

        assert.deepEqual(
            bzPopMaxReply,
            {
                key: 'key',
                value: '1',
                score: 1
            }
        );
    }, GLOBAL.SERVERS.OPEN);
});
